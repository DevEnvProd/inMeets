// WhatsApp Cloud API integration
// This is a demo implementation - replace with actual WhatsApp Business API credentials

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0'
const PHONE_NUMBER_ID = 'your_phone_number_id' // Replace with actual phone number ID
const ACCESS_TOKEN = 'your_access_token' // Replace with actual access token

/**
 * Send a WhatsApp message
 */
export const sendWhatsAppMessage = async (to, message) => {
  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to send message')
    }

    return data
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    throw error
  }
}

/**
 * Handle incoming WhatsApp webhook
 */
export const handleWhatsAppWebhook = async (webhookData) => {
  try {
    const { entry } = webhookData
    
    for (const entryItem of entry) {
      const { changes } = entryItem
      
      for (const change of changes) {
        if (change.field === 'messages') {
          const { messages, contacts } = change.value
          
          if (messages) {
            for (const message of messages) {
              await processIncomingMessage(message, contacts)
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error handling WhatsApp webhook:', error)
    throw error
  }
}

/**
 * Process incoming WhatsApp message
 */
const processIncomingMessage = async (message, contacts) => {
  try {
    const { from, id, timestamp, text, type } = message
    const contact = contacts?.find(c => c.wa_id === from)
    
    // Find or create conversation
    let conversation = await findConversationByNumber(from)
    
    if (!conversation) {
      // Create new conversation if client exists
      const client = await findClientByWhatsAppNumber(from)
      if (client) {
        conversation = await createConversation(client.id, from)
      }
    }

    if (conversation) {
      // Save message to database
      await saveMessage({
        conversation_id: conversation.id,
        message_id: id,
        sender_type: 'client',
        content: text?.body || '',
        message_type: type,
        timestamp: new Date(parseInt(timestamp) * 1000).toISOString()
      })

      // Trigger AI analysis
      await analyzeMessageContent(text?.body || '', conversation.client_id)
    }
  } catch (error) {
    console.error('Error processing incoming message:', error)
  }
}

/**
 * Find conversation by WhatsApp number
 */
const findConversationByNumber = async (whatsappNumber) => {
  try {
    const { data, error } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('whatsapp_number', whatsappNumber)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error finding conversation:', error)
    return null
  }
}

/**
 * Find client by WhatsApp number
 */
const findClientByWhatsAppNumber = async (whatsappNumber) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('whatsapp_number', whatsappNumber)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data
  } catch (error) {
    console.error('Error finding client:', error)
    return null
  }
}

/**
 * Create new conversation
 */
const createConversation = async (clientId, whatsappNumber) => {
  try {
    const { data, error } = await supabase
      .from('whatsapp_conversations')
      .insert([{
        client_id: clientId,
        whatsapp_number: whatsappNumber,
        conversation_id: `conv_${clientId}_${Date.now()}`,
        organization_id: organization.id // This would need to be passed in
      }])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating conversation:', error)
    return null
  }
}

/**
 * Save message to database
 */
const saveMessage = async (messageData) => {
  try {
    const { error } = await supabase
      .from('whatsapp_messages')
      .insert([messageData])

    if (error) throw error
  } catch (error) {
    console.error('Error saving message:', error)
  }
}

/**
 * Analyze message content with AI
 */
const analyzeMessageContent = async (content, clientId) => {
  try {
    // This would integrate with OpenAI or other AI service
    // For demo purposes, we'll use simple keyword analysis
    
    const insights = []
    const lowerContent = content.toLowerCase()

    // Budget keywords
    const budgetKeywords = ['budget', 'price', 'cost', 'expensive', 'cheap', 'afford', 'money']
    if (budgetKeywords.some(keyword => lowerContent.includes(keyword))) {
      insights.push({
        client_id: clientId,
        insight_type: 'budget_update',
        insight_data: {
          keywords: budgetKeywords.filter(keyword => lowerContent.includes(keyword)),
          message: 'Budget-related discussion detected'
        },
        confidence_score: 0.8,
        organization_id: organization.id
      })
    }

    // Intent keywords
    const intentKeywords = ['interested', 'buy', 'purchase', 'viewing', 'visit', 'see']
    if (intentKeywords.some(keyword => lowerContent.includes(keyword))) {
      insights.push({
        client_id: clientId,
        insight_type: 'intent_level',
        insight_data: {
          level: 'high',
          keywords: intentKeywords.filter(keyword => lowerContent.includes(keyword))
        },
        confidence_score: 0.9,
        organization_id: organization.id
      })
    }

    // Save insights
    if (insights.length > 0) {
      const { error } = await supabase
        .from('client_ai_insights')
        .insert(insights)

      if (error) throw error
    }
  } catch (error) {
    console.error('Error analyzing message:', error)
  }
}

/**
 * Get WhatsApp webhook verification
 */
export const verifyWhatsAppWebhook = (mode, token, challenge) => {
  const VERIFY_TOKEN = 'your_verify_token' // Replace with your verify token
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return challenge
  }
  
  return null
}