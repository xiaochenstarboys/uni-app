import CryptoJS from 'crypto-js'

const SECRET_KEY = 'uni_order_2024_key'

/**
 * SHA-256 密码哈希（加固定盐值，上传前执行）
 */
export const encrypt = (password) => {
  return CryptoJS.SHA256(password + SECRET_KEY).toString()
}

/**
 * 生成 16 字节 AES 密钥（从配置密钥派生）
 */
const deriveKey = () => {
  return CryptoJS.enc.Utf8.parse(SECRET_KEY.padEnd(16, '0').slice(0, 16))
}

/**
 * AES-CBC 加密，返回 Base64(IV + 密文)，IV 为随机 16 字节
 */
export const encryptAES = (data) => {
  const key = deriveKey()
  const iv = CryptoJS.lib.WordArray.random(16)
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  // 将 IV 拼接在密文前面一起输出
  const combined = iv.concat(encrypted.ciphertext)
  return CryptoJS.enc.Base64.stringify(combined)
}

/**
 * AES-CBC 解密，密文格式为 Base64(IV + 密文)
 */
export const decryptAES = (ciphertext) => {
  const key = deriveKey()
  const combined = CryptoJS.enc.Base64.parse(ciphertext)
  // 前 16 字节为 IV，剩余为密文
  const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4), 16)
  const cipherWords = combined.words.slice(4)
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.lib.WordArray.create(
      cipherWords,
      combined.sigBytes - 16
    ),
  })
  const bytes = CryptoJS.AES.decrypt(cipherParams, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  })
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
}
