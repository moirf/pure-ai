import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
	DeleteCommand,
	DynamoDBDocumentClient,
	GetCommand,
	PutCommand,
	QueryCommand,
	ScanCommand,
	UpdateCommand,
	type DeleteCommandInput,
	type GetCommandInput,
	type PutCommandInput,
	type QueryCommandInput,
	type ScanCommandInput,
	type UpdateCommandInput,
	type UpdateCommandOutput,
} from '@aws-sdk/lib-dynamodb';

// Centralized DynamoDB document client for API modules to share.
const ddbClient = new DynamoDBClient({});
export const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const QUIZ_TABLE = process.env.QUIZ_TABLE || 'QuizDb';
export const SESSIONS_TABLE = process.env.SESSIONS_TABLE || process.env.SESSIONS_DDB_TABLE || 'SessionDb';

// Provide a runtime "enum-like" object so callers can import `Tables` and
// reference table names in a discoverable, type-safe manner. This keeps
// compatibility with existing named exports while offering an enum-style API.
export const Tables = {
	QUIZ_TABLE,
	SESSIONS_TABLE,
} as const;

export type TableKey = keyof typeof Tables;
export type TableName = typeof Tables[TableKey];

export type DynamoKey = Record<string, any>;
export type DynamoItem = Record<string, any>;

/**
 * Thin wrapper around DynamoDB DocumentClient to keep table-aware operations in a single place.
 * Lets higher-level stores share pagination/query helpers without repeating table metadata.
 */
export class DbTableClient<TItem extends DynamoItem = DynamoItem, TKey extends DynamoKey = DynamoKey> {
	constructor(private readonly tableName: string) {}

	async get(key: TKey, overrides: Omit<GetCommandInput, 'TableName' | 'Key'> = {}) {
		const input: GetCommandInput = { TableName: this.tableName, Key: key, ...overrides };
		const result = await ddbDocClient.send(new GetCommand(input));
		return (result.Item as TItem | undefined) ?? null;
	}

	async put(item: TItem, overrides: Omit<PutCommandInput, 'TableName' | 'Item'> = {}) {
		const input: PutCommandInput = { TableName: this.tableName, Item: item, ...overrides };
		await ddbDocClient.send(new PutCommand(input));
	}

	async update(
		key: TKey,
		update:
			| Partial<TItem>
			| Omit<UpdateCommandInput, 'TableName' | 'Key'>
	): Promise<UpdateCommandOutput> {
		const input = this.buildUpdateInput(key, update);
		return ddbDocClient.send(new UpdateCommand(input));
	}

	async delete(key: TKey, overrides: Omit<DeleteCommandInput, 'TableName' | 'Key'> = {}) {
		const input: DeleteCommandInput = { TableName: this.tableName, Key: key, ...overrides };
		await ddbDocClient.send(new DeleteCommand(input));
	}

	async query(conditions: Omit<QueryCommandInput, 'TableName'>) {
		const input: QueryCommandInput = { TableName: this.tableName, ...conditions };
		const result = await ddbDocClient.send(new QueryCommand(input));
		return (result.Items as TItem[] | undefined) ?? [];
	}

	async scan(options: Omit<ScanCommandInput, 'TableName'> = {}) {
		const input: ScanCommandInput = { TableName: this.tableName, ...options };
		const result = await ddbDocClient.send(new ScanCommand(input));
		return (result.Items as TItem[] | undefined) ?? [];
	}

	private buildUpdateInput(
		key: TKey,
		update:
			| Partial<TItem>
			| Omit<UpdateCommandInput, 'TableName' | 'Key'>
	): UpdateCommandInput {
		if ('UpdateExpression' in update) {
			return { TableName: this.tableName, Key: key, ...update };
		}

		const names: Record<string, string> = {};
		const values: Record<string, any> = {};
		const expressions: string[] = [];
		let counter = 0;

		for (const [attr, value] of Object.entries(update)) {
			counter += 1;
			const nameKey = `#n${counter}`;
			const valueKey = `:v${counter}`;
			names[nameKey] = attr;
			values[valueKey] = value;
			expressions.push(`${nameKey} = ${valueKey}`);
		}

		if (!expressions.length) {
			throw new Error('DbTableClient.update called with empty update object');
		}

		return {
			TableName: this.tableName,
			Key: key,
			UpdateExpression: `SET ${expressions.join(', ')}`,
			ExpressionAttributeNames: names,
			ExpressionAttributeValues: values,
		};
	}
}

export const createDbTableClient = <TItem extends DynamoItem = DynamoItem, TKey extends DynamoKey = DynamoKey>(tableName: string) =>
	new DbTableClient<TItem, TKey>(tableName);

export default ddbDocClient;
