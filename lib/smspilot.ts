const SMSPILOT_API_KEY = process.env.SMSPILOT_API_KEY
const SMSPILOT_SENDER = process.env.SMSPILOT_SENDER || 'INFORM'

export async function sendSms(phone: string, code: string) {
  const message = `Ваш код для входа: ${code}`
  const url = `https://smspilot.ru/api.php?send=${encodeURIComponent(message)}&to=${encodeURIComponent(phone)}&from=${encodeURIComponent(SMSPILOT_SENDER)}&apikey=${SMSPILOT_API_KEY}&format=json`

  try {
    const response = await fetch(url, { method: 'GET' })
    const data = await response.json()
    
    if (data.error) {
      console.error('SmsPilot error:', data.error.description_ru)
      return { success: false, error: data.error.description_ru }
    }
    
    return { success: true }
  } catch (error) {
    console.error('SmsPilot fetch error:', error)
    return { success: false, error: 'Network error' }
  }
}