import CryptoJS from 'crypto-js'

const SECRET_KEY = 'uni_order_2024_key'

export const encrypt = (password) => {
  return CryptoJS.SHA256(password + SECRET_KEY).toString()
}

export const encryptAES = (data) => {
  const key = CryptoJS.enc.Utf8.parse(SECRET_KEY.padEnd(16, '0').slice(0, 16))
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  return encrypted.toString()
}

export const decryptAES = (ciphertext) => {
  const key = CryptoJS.enc.Utf8.parse(SECRET_KEY.padEnd(16, '0').slice(0, 16))
  const bytes = CryptoJS.AES.decrypt(ciphertext, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
}
