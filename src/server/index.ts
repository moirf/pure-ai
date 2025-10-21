import express, { Request, Response } from 'express';
import path from 'path';
import { readFile } from 'fs/promises';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const app = express();
app.use(express.json());

// Prepare Next.js
nextApp.prepare().then(() => {
    // Define API routes
    app.get('/api/health', (req: Request, res: Response) => {
        console.log('Health check endpoint hit');
        res.json({ status: 'Server is running' });
    });

    app.get('/api/quizzes/:id/questions', async (req: Request, res: Response) => {
        try {
            const questionsPath = path.join(__dirname, 'db', 'questions.json');
            console.log('Questions file path:', questionsPath);
            const data = await readFile(questionsPath, 'utf8');
            const questions = JSON.parse(data);
            console.log('Loaded questions:', questions);
            res.json(questions);
        } catch (error) {
            console.error('Error loading questions:', error);
            res.status(500).json({ error: 'Failed to load questions.' });
        }
    });

    // Let Next.js handle all other routes
    app.all('*', (req, res) => {
        return handle(req, res);
    });

    // Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
