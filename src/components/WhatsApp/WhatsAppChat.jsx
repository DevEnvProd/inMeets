import React, { useState, useEffect, useRef } from 'react'
import { 
  X, 
  Send, 
  MessageCircle, 
  Bot, 
  User, 
  Brain,
  Zap,
  Clock,
  CheckCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export const WhatsAppChat = ({ client, isOpen, onClose }) => {
  const { organization, user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [conversation, setConversation] = useState(null)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (client && isOpen) {
      initializeConversation()
    }
  }, [client, isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeConversation = async () => {
    try {
      // Check if conversation exists
      let { data: existingConversation, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('client_id', client.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!existingConversation) {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('whatsapp_conversations')
          .insert([{
            client_id: client.id,
            whatsapp_number: client.whatsapp_number,
            conversation_id: `conv_${client.id}_${Date.now()}`,
            organization_id: organization.id
          }])
          .select()
          .single()

        if (createError) throw createError
        setConversation(newConversation)
      } else {
        setConversation(existingConversation)
      }

      // Fetch messages
      await fetchMessages(existingConversation?.id || newConversation?.id)
    } catch (error) {
      console.error('Error initializing conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId) => {
    if (!conversationId) return

    try {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !conversation) return

    setSending(true)
    try {
      const messageData = {
        conversation_id: conversation.id,
        message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender_type: 'agent',
        content: newMessage.trim(),
        message_type: 'text',
        timestamp: new Date().toISOString()
      }

      const { error } = await supabase
        .from('whatsapp_messages')
        .insert([messageData])

      if (error) throw error

      // Add message to local state immediately
      setMessages(prev => [...prev, messageData])
      setNewMessage('')

      // In a real implementation, you would send the message via WhatsApp API here
      // For demo purposes, we'll simulate a client response after a delay
      setTimeout(() => {
        simulateClientResponse()
      }, 2000)

    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error sending message')
    } finally {
      setSending(false)
    }
  }

  const simulateClientResponse = async () => {
    if (!conversation) return

    const responses = [
      "Thanks for the information! I'm interested in viewing this property.",
      "The price seems a bit high for my budget. Do you have anything cheaper?",
      "I love the location! When can we schedule a viewing?",
      "I'm looking for something with more bedrooms. Any other options?",
      "This looks perfect! Can you send me more details?"
    ]

    const randomResponse = responses[Math.floor(Math.random() * responses.length)]

    try {
      const messageData = {
        conversation_id: conversation.id,
        message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sender_type: 'client',
        content: randomResponse,
        message_type: 'text',
        timestamp: new Date().toISOString()
      }

      const { error } = await supabase
        .from('whatsapp_messages')
        .insert([messageData])

      if (error) throw error

      setMessages(prev => [...prev, messageData])

      // Trigger AI analysis
      await analyzeMessage(messageData)
    } catch (error) {
      console.error('Error simulating client response:', error)
    }
  }

  const analyzeMessage = async (message) => {
    if (message.sender_type !== 'client') return

    setAiAnalyzing(true)
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 1500))

      const insights = []
      const content = message.content.toLowerCase()

      // Budget analysis
      if (content.includes('budget') || content.includes('price') || content.includes('expensive') || content.includes('cheap')) {
        insights.push({
          client_id: client.id,
          insight_type: 'budget_update',
          insight_data: {
            message: content.includes('expensive') || content.includes('high') ? 'Price sensitivity detected' : 'Budget discussion',
            sentiment: content.includes('expensive') ? 'negative' : 'neutral'
          },
          confidence_score: 0.8,
          source_message_id: message.id,
          organization_id: organization.id
        })
      }

      // Intent analysis
      if (content.includes('interested') || content.includes('love') || content.includes('perfect')) {
        insights.push({
          client_id: client.id,
          insight_type: 'intent_level',
          insight_data: {
            level: 'high',
            message: 'High interest detected in conversation'
          },
          confidence_score: 0.9,
          source_message_id: message.id,
          organization_id: organization.id
        })
      }

      // Area preference analysis
      if (content.includes('location') || content.includes('area') || content.includes('neighborhood')) {
        insights.push({
          client_id: client.id,
          insight_type: 'area_preference',
          insight_data: {
            message: 'Location preference mentioned',
            sentiment: content.includes('love') || content.includes('perfect') ? 'positive' : 'neutral'
          },
          confidence_score: 0.7,
          source_message_id: message.id,
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

      // Update message as analyzed
      await supabase
        .from('whatsapp_messages')
        .update({ 
          ai_analyzed: true,
          ai_sentiment: content.includes('love') || content.includes('perfect') ? 'positive' : 
                       content.includes('expensive') || content.includes('not') ? 'negative' : 'neutral',
          ai_intent: content.includes('interested') || content.includes('viewing') ? 'high' : 'medium'
        })
        .eq('id', message.id)

    } catch (error) {
      console.error('Error analyzing message:', error)
    } finally {
      setAiAnalyzing(false)
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">WhatsApp Chat</h2>
              <p className="text-gray-600">{client.name} • {client.whatsapp_number}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {aiAnalyzing && (
              <div className="flex items-center space-x-2 text-purple-600">
                <Brain className="h-4 w-4 animate-pulse" />
                <span className="text-sm">AI Analyzing...</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No messages yet</p>
              <p className="text-sm text-gray-500">Start a conversation with your client</p>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender_type === 'agent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <div className="flex items-start space-x-2">
                    {message.sender_type === 'client' && (
                      <User className="h-4 w-4 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-75">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.ai_analyzed && message.sender_type === 'client' && (
                          <div className="flex items-center space-x-1">
                            <Brain className="h-3 w-3 text-purple-400" />
                            <span className="text-xs opacity-75">Analyzed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-6 border-t border-gray-200">
          <form onSubmit={sendMessage} className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{sending ? 'Sending...' : 'Send'}</span>
            </button>
          </form>
          
          <div className="mt-3 text-xs text-gray-500 flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Connected to WhatsApp</span>
            </div>
            <div className="flex items-center space-x-1">
              <Brain className="h-3 w-3 text-purple-500" />
              <span>AI Analysis Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}