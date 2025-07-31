import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'your_verify_token'

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Handle GET request for webhook verification
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      console.log('🔍 Webhook verification request:', { mode, token })

      if (mode === 'subscribe' && token === verifyToken) {
        console.log('✅ Webhook verified successfully')
        return new Response(challenge, {
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
          status: 200,
        })
      } else {
        console.log('❌ Webhook verification failed')
        return new Response('Forbidden', {
          headers: corsHeaders,
          status: 403,
        })
      }
    }

    // Handle POST request for incoming messages
    if (req.method === 'POST') {
      const webhookData = await req.json()
      console.log('📨 Incoming WhatsApp webhook:', JSON.stringify(webhookData, null, 2))

      const { entry } = webhookData

      for (const entryItem of entry) {
        const { changes } = entryItem

        for (const change of changes) {
          if (change.field === 'messages') {
            const { messages, contacts } = change.value

            if (messages) {
              for (const message of messages) {
                await processIncomingMessage(message, contacts, supabase)
              }
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    return new Response('Method not allowed', {
      headers: corsHeaders,
      status: 405,
    })
  } catch (error) {
    console.error('❌ WhatsApp webhook error:', error.message)

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function processIncomingMessage(message: any, contacts: any[], supabase: any) {
  try {
    const { from, id, timestamp, text, type } = message
    console.log('📱 Processing message from:', from)

    // Find client by WhatsApp number
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('whatsapp_number', from)
      .single()

    if (clientError || !client) {
      console.log('❌ Client not found for WhatsApp number:', from)
      return
    }

    // Find or create conversation
    let { data: conversation, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('client_id', client.id)
      .single()

    if (convError && convError.code === 'PGRST116') {
      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('whatsapp_conversations')
        .insert([{
          client_id: client.id,
          whatsapp_number: from,
          conversation_id: `conv_${client.id}_${Date.now()}`,
          organization_id: client.organization_id
        }])
        .select()
        .single()

      if (createError) throw createError
      conversation = newConversation
    } else if (convError) {
      throw convError
    }

    // Save message
    const messageData = {
      conversation_id: conversation.id,
      message_id: id,
      sender_type: 'client',
      content: text?.body || '',
      message_type: type,
      timestamp: new Date(parseInt(timestamp) * 1000).toISOString()
    }

    const { error: messageError } = await supabase
      .from('whatsapp_messages')
      .insert([messageData])

    if (messageError) throw messageError

    // Trigger AI analysis
    await analyzeMessage(text?.body || '', client, supabase)

    console.log('✅ Message processed successfully')
  } catch (error) {
    console.error('❌ Error processing message:', error)
  }
}

async function analyzeMessage(content: string, client: any, supabase: any) {
  try {
    const insights = []
    const lowerContent = content.toLowerCase()

    // Budget analysis
    const budgetKeywords = ['budget', 'price', 'cost', 'expensive', 'cheap', 'afford', 'money']
    if (budgetKeywords.some(keyword => lowerContent.includes(keyword))) {
      insights.push({
        client_id: client.id,
        insight_type: 'budget_update',
        insight_data: {
          keywords: budgetKeywords.filter(keyword => lowerContent.includes(keyword)),
          message: 'Budget discussion detected',
          sentiment: lowerContent.includes('expensive') || lowerContent.includes('too much') ? 'negative' : 'neutral'
        },
        confidence_score: 0.8,
        organization_id: client.organization_id
      })
    }

    // Intent analysis
    const intentKeywords = ['interested', 'buy', 'purchase', 'viewing', 'visit', 'see', 'love', 'perfect']
    if (intentKeywords.some(keyword => lowerContent.includes(keyword))) {
      const highIntentKeywords = ['love', 'perfect', 'buy', 'purchase']
      const intentLevel = highIntentKeywords.some(keyword => lowerContent.includes(keyword)) ? 'high' : 'medium'
      
      insights.push({
        client_id: client.id,
        insight_type: 'intent_level',
        insight_data: {
          level: intentLevel,
          keywords: intentKeywords.filter(keyword => lowerContent.includes(keyword)),
          message: `${intentLevel} intent detected`
        },
        confidence_score: intentLevel === 'high' ? 0.9 : 0.7,
        organization_id: client.organization_id
      })
    }

    // Area preference analysis
    const areaKeywords = ['location', 'area', 'neighborhood', 'district', 'near', 'close to']
    if (areaKeywords.some(keyword => lowerContent.includes(keyword))) {
      insights.push({
        client_id: client.id,
        insight_type: 'area_preference',
        insight_data: {
          keywords: areaKeywords.filter(keyword => lowerContent.includes(keyword)),
          message: 'Location preference mentioned'
        },
        confidence_score: 0.7,
        organization_id: client.organization_id
      })
    }

    // Urgency analysis
    const urgencyKeywords = ['urgent', 'asap', 'soon', 'quickly', 'immediately', 'this week', 'today']
    if (urgencyKeywords.some(keyword => lowerContent.includes(keyword))) {
      insights.push({
        client_id: client.id,
        insight_type: 'urgency',
        insight_data: {
          level: 'high',
          keywords: urgencyKeywords.filter(keyword => lowerContent.includes(keyword)),
          message: 'High urgency detected'
        },
        confidence_score: 0.85,
        organization_id: client.organization_id
      })
    }

    // Save insights
    if (insights.length > 0) {
      const { error } = await supabase
        .from('client_ai_insights')
        .insert(insights)

      if (error) throw error
      console.log('🧠 AI insights generated:', insights.length)
    }

    // Trigger property recommendations update
    await updatePropertyRecommendations(client.id, supabase)

  } catch (error) {
    console.error('❌ Error analyzing message:', error)
  }
}

async function updatePropertyRecommendations(clientId: string, supabase: any) {
  try {
    // Call the database function to regenerate recommendations
    const { error } = await supabase.rpc('generate_ai_recommendations', {
      client_uuid: clientId
    })

    if (error) throw error
    console.log('🎯 Property recommendations updated')
  } catch (error) {
    console.error('❌ Error updating recommendations:', error)
  }
}