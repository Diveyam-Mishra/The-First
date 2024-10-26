import express from 'express';
const router = express.Router();
/**
 * @swagger
 * /working:
 *   post:
 *     summary: Convert text to lowercase
 *     description: Accepts a JSON object with a `text` field and returns the lowercase version of that text.
 *     tags: [Text]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text to convert to lowercase
 *                 example: "HELLO WORLD"
 *     responses:
 *       200:
 *         description: Text converted to lowercase
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lowercaseText:
 *                   type: string
 *                   description: The lowercase version of the input text
 *                   example: "hello world"
 */
router.post('/working', (req, res) => {
    try {
        const { str1 } = req.body;
        if (!str1 || typeof str1 !== 'string') {
            return res.status(400).json({ error: 'str1 must be a valid string' });
        }
        const result = str1.toLowerCase();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;