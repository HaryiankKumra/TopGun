
export const getLocalStressRecommendations = (userMessage: string) => {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('stressed') || lowerMessage.includes('anxious') || lowerMessage.includes('worried')) {
    return {
      response: "I understand you're feeling stressed. Here are some immediate techniques that can help:\n\n🫁 **4-7-8 Breathing**: Inhale for 4 counts, hold for 7, exhale for 8\n\n🧘 **Progressive Muscle Relaxation**: Tense and release each muscle group\n\n🌿 **Grounding Technique**: Name 5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste\n\nWould you like me to guide you through any of these exercises?",
      stressLevel: 'high'
    };
  }
  
  if (lowerMessage.includes('calm') || lowerMessage.includes('relaxed') || lowerMessage.includes('good') || lowerMessage.includes('fine')) {
    return {
      response: "That's wonderful to hear! 😊 Since you're feeling calm, this is a great time to build resilience. Consider:\n\n✨ **Mindfulness Practice**: Spend 5 minutes observing your breath\n\n📝 **Gratitude Journal**: Write down 3 things you're grateful for\n\n🚶 **Gentle Movement**: A short walk or light stretching\n\nKeeping up these habits will help maintain your positive state!",
      stressLevel: 'low'
    };
  }
  
  const defaultResponses = [
    "I'm here to help you manage stress. Can you tell me more about what's on your mind?",
    "Thank you for sharing. Based on your biometric data, I can provide personalized recommendations. What would be most helpful right now?",
    "Every feeling is valid. Let's work together to find strategies that work best for you. What usually helps you feel better?",
  ];
  
  return {
    response: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
    stressLevel: 'medium'
  };
};
