import { HumanMessage } from "@langchain/core/messages";
import { agent } from "../config/ai.config.js";
import axios from 'axios';



export const chatQuery = async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await agent.invoke({
      messages: [new HumanMessage(prompt)],
    });
    // console.log(response);
    res.json({ message: response.messages[1]?.content});
  } catch (error) {
    console.error("Error in /ai/chat:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const researchQuery = async (req, res) => {
  const { topic } = req.body;
  console.log(topic)
  try {
    // Validate input
    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({ error: 'Research topic is required' });
    }

    // Call n8n research webhook
    const n8nWebhookUrl = process.env.N8N_RESEARCH_WEBHOOK_URL;
    
    if (!n8nWebhookUrl) {
      return res.status(500).json({ error: 'Research service not configured' });
    }

    const response = await axios.get(n8nWebhookUrl, {
      params:{
        topic: topic.trim()
      }
    }, {
      timeout: 180000 // 3 minute timeout for research generation
    });

    // Extract the research document from n8n response
    const researchDocument = response.data.output || response.data;

    // Validate response structure
    if (!researchDocument.body || !researchDocument.css || !researchDocument.tittle) {
      return res.status(500).json({ error: 'Invalid research document format' });
    }

    res.json({
      success: true,
      document: {
        body: researchDocument.body,
        css: researchDocument.css,
        title: researchDocument.tittle // Note: n8n returns 'tittle' (typo)
      }
    });
  } catch (error) {
    console.error('Error in /ai/research:', error);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Research generation timeout' });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate research document',
      details: error.message 
    });
  }
};
