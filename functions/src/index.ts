import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

/**
 * セーブデータのクラウド同期(Phase 5)。
 *
 * 注意: このファイルはロジックのみの実装であり、実Firebaseプロジェクトへの
 * 接続・デプロイは行っていない(`firebase.json`/プロジェクトIDの設定は未実施)。
 * 実際にクラウド同期を有効化するには、Firebaseプロジェクトを作成し
 * `firebase init functions` 等でこのディレクトリを接続する必要がある。
 */
initializeApp();

const SAVE_DATA_MAX_BYTES = 200_000; // 不正に巨大なペイロードでFirestoreを圧迫しないための上限

interface SaveGameStateRequest {
  state: unknown;
}

interface LoadGameStateResponse {
  state: unknown | null;
  updatedAt: string | null;
}

export const saveGameState = onCall<SaveGameStateRequest>(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'ログインが必要です');
  }

  const serialized = JSON.stringify(request.data.state ?? null);
  if (Buffer.byteLength(serialized, 'utf8') > SAVE_DATA_MAX_BYTES) {
    throw new HttpsError('invalid-argument', 'セーブデータが上限サイズを超えています');
  }

  const db = getFirestore();
  await db.collection('saves').doc(uid).set({
    state: request.data.state,
    updatedAt: new Date().toISOString(),
  });

  return { ok: true };
});

export const loadGameState = onCall<void>(async (request): Promise<LoadGameStateResponse> => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'ログインが必要です');
  }

  const db = getFirestore();
  const doc = await db.collection('saves').doc(uid).get();
  if (!doc.exists) {
    return { state: null, updatedAt: null };
  }

  const data = doc.data();
  return { state: data?.state ?? null, updatedAt: data?.updatedAt ?? null };
});
