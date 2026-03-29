import * as bip39 from 'bip39';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { hkdf } from '@noble/hashes/hkdf';
import { bytesToHex } from '@noble/hashes/utils';
import {
  RECOVERY_PHRASE_BITS,
  PBKDF2_ITERATIONS,
  PBKDF2_SALT,
  HKDF_INFO_PRIVATE_DIARY,
} from '@peemail/shared';

export interface DerivedIdentity {
  /** BIP39 12-word 助记词，用户自行保管，不经网络传输 */
  recoveryPhrase: string;
  /** SHA-256(masterKey)，提交给服务端用于换机恢复校验 */
  identityKeyHash: string;
  /** 私密日记加密密钥（hex），纯客户端使用 */
  privateDiaryKey: string;
}

/**
 * 首次启动时在客户端本地生成身份
 * 恢复码不经任何网络传输，服务端零知识
 */
export async function generateIdentity(): Promise<DerivedIdentity> {
  const recoveryPhrase = bip39.generateMnemonic(RECOVERY_PHRASE_BITS);
  return deriveFromPhrase(recoveryPhrase);
}

/**
 * 换机恢复时，用恢复码重新派生密钥
 */
export async function deriveFromPhrase(recoveryPhrase: string): Promise<DerivedIdentity> {
  if (!bip39.validateMnemonic(recoveryPhrase)) {
    throw new Error('Invalid recovery phrase');
  }

  const phraseBytes = new TextEncoder().encode(recoveryPhrase);
  const saltBytes = new TextEncoder().encode(PBKDF2_SALT);

  // master_key = PBKDF2(recovery_phrase, salt, iterations, 32 bytes)
  const masterKey = pbkdf2(sha256, phraseBytes, saltBytes, {
    c: PBKDF2_ITERATIONS,
    dkLen: 32,
  });

  // identity_key_hash = SHA-256(master_key)  ← 提交给服务端
  const identityKeyHash = bytesToHex(sha256(masterKey));

  // private_diary_key = HKDF(master_key, info="private-diary")  ← 纯客户端
  const privateDiaryKey = bytesToHex(
    hkdf(sha256, masterKey, undefined, HKDF_INFO_PRIVATE_DIARY, 32),
  );

  return { recoveryPhrase, identityKeyHash, privateDiaryKey };
}

/**
 * 计算设备指纹的 SHA-256 hash
 * deviceFingerprint 由 platform + model + installUUID 拼接
 */
export function hashDeviceFingerprint(fingerprint: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(fingerprint)));
}
