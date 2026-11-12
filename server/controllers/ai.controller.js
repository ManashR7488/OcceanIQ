import { HumanMessage } from "@langchain/core/messages";
import { agent } from "../config/ai.config.js";
import axios from 'axios';
import UserDataset from "../models/UserDataset.model.js";

/**
 * Sanitize user ID for microservice compatibility
 * Removes non-alphanumeric characters to match microservice regex
 */
function sanitizeUserId(userId) {
  return userId.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
}

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
  console.log('Research Request Topic:', topic)
  try {
    // Validate input
    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({ error: 'Research topic is required' });
    }

    // Call Python Microservice
    const microserviceUrl = process.env.MICROSERVICE_URL || 'http://localhost:8000';
    
    // Using axios imported from line 3
    const response = await axios.post(`${microserviceUrl}/research`, {
      topic: topic.trim()
    }, {
      timeout: 180000 // 3 minute timeout
    });

    if (response.data.success && response.data.document) {
      res.json({
        success: true,
        document: response.data.document
      });
    } else {
      throw new Error('Invalid response from microservice');
    }

  } catch (error) {
    console.error('Error in /ai/research:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Research generation timeout' });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate research document',
      details: error.response?.data?.detail || error.message 
    });
  }
};

export const dataUploadProxy = async (req, res) => {
  const file = req.file;
  const userId = req.user._id.toString();
  const sanitizedUserId = sanitizeUserId(userId);
  
  console.log('Data Upload Request:', { filename: file?.originalname, userId, sanitized: sanitizedUserId });
  
  try {
    // Validate inputs
    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }
    
    // Call Python Microservice
    const microserviceUrl = process.env.MICROSERVICE_URL || 'http://localhost:8000';
    
    // Create form data with file buffer
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype
    });
    formData.append('user_id', sanitizedUserId);
    
    const response = await axios.post(`${microserviceUrl}/data-upload`, formData, {
      headers: {
        ...formData.getHeaders()
      },
      timeout: 60000, // 60 second timeout
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
    
    if (response.data.success) {
      const documentId = response.data.document_id;
      
      // Verify data is queryable
      try {
        console.log('[DataUpload] Verifying data retrieval...');
        const verifyResponse = await axios.post(`${microserviceUrl}/data-chat`, {
          user_id: sanitizedUserId,
          query: 'test',
          document_id: documentId,
          conversation_history: []
        }, { timeout: 10000 });
        
        if (!verifyResponse.data.sources || verifyResponse.data.sources.length === 0) {
          // Verification failed - data not retrievable
          console.error('[DataUpload] Verification failed: No chunks retrieved');
          
          // Attempt cleanup
          try {
            await axios.delete(`${microserviceUrl}/data-delete`, {
              data: { user_id: sanitizedUserId, document_id: documentId },
              timeout: 5000
            });
          } catch (cleanupError) {
            console.error('[DataUpload] Cleanup failed:', cleanupError.message);
          }
          
          return res.status(500).json({
            success: false,
            error: 'Data upload verification failed',
            message: 'Data was stored but could not be retrieved. Please try again.',
            details: 'Post-upload verification query returned no results'
          });
        }
        
        console.log(`[DataUpload] Verification passed: ${verifyResponse.data.sources.length} chunks retrieved`);
      } catch (verifyError) {
        console.error('[DataUpload] Verification error:', verifyError.message);
        // Continue with save - verification failure shouldn't block upload
      }
      
      // Save dataset metadata to MongoDB
      try {
        const fileExt = file.originalname.split('.').pop().toLowerCase();
        const fileType = fileExt === 'nc' ? 'netcdf' : fileExt;
        
        const dataset = new UserDataset({
          userId: req.user._id,
          filename: response.data.filename,
          fileType: fileType,
          documentId: response.data.document_id,
          fileSize: file.size,
          metadata: {
            chunksStored: response.data.chunks_stored,
            ...response.data.metadata
          }
        });
        
        await dataset.save();
        
        return res.json({
          success: true,
          id: dataset._id.toString(),
          document_id: response.data.document_id,
          filename: response.data.filename,
          chunks_stored: response.data.chunks_stored,
          metadata: response.data.metadata,
          message: response.data.message
        });
      } catch (mongoError) {
        // Log error and return failure (vector data stored but no persistence)
        console.error('MongoDB save error:', mongoError.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to save dataset metadata',
          message: 'Data was uploaded to vector store but could not be persisted. Please try uploading again.',
          details: mongoError.message
        });
      }
    } else {
      throw new Error('Invalid response from microservice');
    }
    
  } catch (error) {
    console.error('Error in /ai/data-upload:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Data upload timeout' });
    }
    
    // Forward microservice error status and details
    const status = error.response?.status || 500;
    res.status(status).json({
      error: 'Failed to upload data file',
      details: error.response?.data?.detail || error.message
    });
  }
};

export const dataChatProxy = async (req, res) => {
  const { query, dataset_id, conversation_history } = req.body;
  const userId = req.user._id;
  const sanitizedUserId = sanitizeUserId(userId.toString());
  
  console.log('[DataChat] Request received:', {
    userId,
    sanitized: sanitizedUserId,
    query: query?.substring(0, 50),
    dataset_id,
    historyLength: conversation_history?.length || 0
  });
  
  try {
    // Validate inputs
    if (!query || query.trim().length === 0) {
      console.error('[DataChat] Validation failed: Empty query');
      return res.status(400).json({ 
        success: false,
        error: 'Query is required',
        message: 'Please enter a question about your data'
      });
    }
    
    // Lookup dataset and verify ownership
    let documentId = null;
    if (dataset_id) {
      const dataset = await UserDataset.findOne({ _id: dataset_id, userId: userId });
      
      if (!dataset) {
        console.error('[DataChat] Dataset not found:', { dataset_id, userId });
        return res.status(404).json({
          success: false,
          error: 'Dataset not found',
          message: 'The requested dataset does not exist or you do not have access to it'
        });
      }
      
      documentId = dataset.documentId;
      console.log('[DataChat] Dataset found:', { 
        dataset_id, 
        documentId, 
        filename: dataset.filename 
      });
    }
    
    // Call Python Microservice
    const microserviceUrl = process.env.MICROSERVICE_URL || 'http://localhost:8000';
    
    console.log('[DataChat] Calling microservice:', {
      url: `${microserviceUrl}/data-chat`,
      user_id: sanitizedUserId,
      document_id: documentId
    });
    
    const response = await axios.post(`${microserviceUrl}/data-chat`, {
      user_id: sanitizedUserId,
      query: query.trim(),
      document_id: documentId,
      conversation_history: conversation_history || []
    }, {
      // Timeout: Microservice LLM timeout is 90s + retry/fallback overhead
      // Set Node timeout slightly higher to allow microservice to complete
      timeout: 100000 // 100 second timeout (90s LLM + 10s buffer)
    });
    
    console.log('[DataChat] Microservice response:', {
      success: response.data.success,
      responseLength: response.data.response?.length || 0,
      sourcesCount: response.data.sources?.length || 0,
      hasError: response.data.error || false,
      hasErrorDetails: !!response.data.error_details
    });
    
    if (response.data.success) {
      // Validate response structure before sending to frontend
      if (!response.data.response || typeof response.data.response !== 'string') {
        console.error('[DataChat] Invalid microservice response structure:', response.data);
        return res.status(500).json({
          success: false,
          error: 'Invalid response from AI service',
          message: 'The AI service returned an invalid response format'
        });
      }

      res.json({
        success: true,
        response: response.data.response,
        sources: response.data.sources || [],
        conversation_history: response.data.conversation_history || [],
        message: response.data.message
      });
    } else {
      // Forward structured error response from microservice
      console.error('[DataChat] Microservice returned success=false:', {
        error: response.data.error,
        errorDetails: response.data.error_details
      });
      
      res.json({
        success: false,
        response: response.data.response || 'Unable to generate response',
        error: response.data.error || true,
        error_details: response.data.error_details || null,
        message: response.data.message || 'Failed to process query',
        sources: response.data.sources || [],
        conversation_history: response.data.conversation_history || []
      });
    }
    
  } catch (error) {
    console.error('[DataChat] Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ 
        success: false,
        error: 'Data chat timeout',
        message: 'The request took too long. Please try a simpler question.'
      });
    }
    
    // Forward microservice error status and details
    const status = error.response?.status || 500;
    res.status(status).json({
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to process chat query',
      details: error.response?.data?.detail || error.message
    });
  }
};
