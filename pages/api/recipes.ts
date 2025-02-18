// pages/api/recipes.ts

import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const query = req.query.query;

  // Return early if no query provided
  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  const API_KEY = process.env.SPOONACULAR_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const response = await fetch(
      `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(
        query as string
      )}&apiKey=${API_KEY}&number=10&addRecipeInformation=true`
    );

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

export default handler;
