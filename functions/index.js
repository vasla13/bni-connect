// functions/index.js
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ region: "us-central1" });

// --- 1. FONCTION JEU & UPDATE PROFIL ---
exports.submitTask = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Identité introuvable.');

  // On récupère la réponse ET l'objet question complet
  const { answer, questionData } = data; 
  
  const uid = auth.uid;
  const userRef = admin.firestore().collection("users").doc(uid);
  const historyRef = userRef.collection("history").doc(); 
  
  const today = new Date().toLocaleDateString('fr-FR');
  
  // Le montant est dynamique (défini par la question), sinon 50 par défaut
  const REWARD_AMOUNT = questionData.reward || 50;

  return admin.firestore().runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) throw new HttpsError('not-found', 'Utilisateur inconnu.');

    const userData = userDoc.data();
    
    // A. Vérification Quota
    let currentCount = 0;
    if (userData.game && userData.game.lastQuestionDate === today) {
      currentCount = userData.game.dailyCount || 0;
    }

    if (currentCount >= 5) {
      return { success: false, message: "Quota quotidien atteint." };
    }

    // B. LOGIQUE DE JEU (Calculs)
    const newBalance = (userData.economy.enAttente || 0) + REWARD_AMOUNT;
    const newCount = currentCount + 1;
    
    // Préparation de l'update principal
    const updates = {
      "economy.enAttente": newBalance,
      "game.dailyCount": newCount,
      "game.lastQuestionDate": today,
      // On sauvegarde la réponse dans l'historique des réponses
      "game.answers": admin.firestore.FieldValue.arrayUnion({
          questionId: questionData.id || "unknown",
          question: questionData.text,
          reponse: answer,
          tag: questionData.tag || "GENERAL",
          date: new Date().toISOString()
      })
    };

    // C. LOGIQUE SPÉCIALE : UPDATE PROFIL (targetField)
    // Si la question contient un champ cible (ex: "info.telephone")
    if (questionData.targetField) {
        // On ajoute dynamiquement le champ à mettre à jour
        updates[questionData.targetField] = answer;
    }

    transaction.update(userRef, updates);

    // D. Log Historique Financier
    transaction.set(historyRef, {
      type: 'gain',
      label: `Mission ${questionData.tag || 'Standard'}`,
      montant: REWARD_AMOUNT,
      date: new Date().toISOString()
    });

    return { success: true, reward: REWARD_AMOUNT, message: "Données transmises." };
  });
});

// --- 2. FONCTION ADMIN (inchangée, mais je la remets pour completude) ---
exports.manageWithdrawal = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Accès interdit.');
  const { withdrawalId, action } = data;
  const db = admin.firestore();
  const withdrawalRef = db.collection("withdrawals").doc(withdrawalId);

  return db.runTransaction(async (transaction) => {
    const withdrawalDoc = await transaction.get(withdrawalRef);
    if (!withdrawalDoc.exists) throw new HttpsError('not-found', 'Demande introuvable.');
    const withdrawalData = withdrawalDoc.data();
    
    if (withdrawalData.statut && withdrawalData.statut !== 'pending') {
        throw new HttpsError('failed-precondition', 'Déjà traité.');
    }

    const userRef = db.collection("users").doc(withdrawalData.userId);
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) throw new HttpsError('not-found', 'Utilisateur introuvable.');
    const userData = userDoc.data();

    if (action === 'approve') {
      const newEnAttente = (userData.economy.enAttente || 0) - withdrawalData.montant;
      const newGagneTotal = (userData.economy.gagneTotal || 0) + withdrawalData.montant;
      transaction.update(userRef, {
        "economy.enAttente": newEnAttente < 0 ? 0 : newEnAttente,
        "economy.gagneTotal": newGagneTotal,
        "economy.statutRetrait": "none"
      });
      transaction.update(withdrawalRef, { statut: 'approved', processedAt: new Date().toISOString() });
      transaction.set(userRef.collection("history").doc(), { type: 'admin', label: 'Virement validé', montant: withdrawalData.montant, date: new Date().toISOString() });
    } else if (action === 'reject') {
      transaction.update(userRef, { "economy.statutRetrait": "none" });
      transaction.update(withdrawalRef, { statut: 'rejected', processedAt: new Date().toISOString() });
      transaction.set(userRef.collection("history").doc(), { type: 'admin', label: 'Virement refusé', montant: 0, date: new Date().toISOString() });
    }
    return { success: true };
  });
});