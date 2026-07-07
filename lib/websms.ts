const WEBSMS_API_KEY = process.env.WEBSMS_API_KEY

export async function sendSms(phone: string, code: string) {
  const message = `Ваш код для входа: ${code}`
  
  try {
    const response = await fetch('https://websms.ru/api/v2/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEBSMS_API_KEY}`
      },
      body: JSON.stringify({
        to: phone,
        message: message
      })
    })

    const data = await response.json()
    
    // WebSMS возвращает объект с информацией о сообщении
    if (data.error || data.status === 'error') {
      console.error('WebSMS error:', data)
      return { success: false, error: data.error?.message || 'Ошибка отправки' }
    }
    
    console.log('WebSMS success:', data)
    return { success: true }
  } catch (error) {
    console.error('WebSMS fetch error:', error)
    return { success: false, error: 'Network error' }
  }
}