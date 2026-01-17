const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ region: "us-central1" });

// --- 1. FONCTION JEU & UPDATE PROFIL ---
exports.submitTask = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Identité introuvable.');

  const { answer, questionData } = data; 
  
  const uid = auth.uid;
  const userRef = admin.firestore().collection("users").doc(uid);
  const historyRef = userRef.collection("history").doc(); 
  
  const today = new Date().toLocaleDateString('fr-FR');
  
  // --- CORRECTION 1 : NETTOYAGE DU MONTANT ---
  // On s'assure que REWARD_AMOUNT est un nombre entier, même si on reçoit "1500 $"
  let rawReward = questionData.reward || 50;
  let parsedReward = 50; // Valeur par défaut
  
  if (typeof rawReward === 'number') {
      parsedReward = rawReward;
  } else if (typeof rawReward === 'string') {
      // Enlève tout ce qui n'est pas un chiffre (ex: "1500 $" -> 1500)
      parsedReward = parseInt(rawReward.replace(/[^0-9]/g, ''), 10);
  }
  // Si le parsing échoue (NaN), on remet 50
  if (isNaN(parsedReward)) parsedReward = 50;

  const REWARD_AMOUNT = parsedReward;

  // --- CORRECTION 2 : GESTION TYPE (Question vs Formulaire) ---
  const isForm = questionData.type === 'form_submission';
  const labelText = questionData.title || questionData.text || "Mission Inconnue";

  return admin.firestore().runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) throw new HttpsError('not-found', 'Utilisateur inconnu.');

    const userData = userDoc.data();
    
    // A. Vérification Quota (Uniquement pour les petites questions, pas les gros formulaires)
    let currentCount = 0;
    if (userData.game && userData.game.lastQuestionDate === today) {
      currentCount = userData.game.dailyCount || 0;
    }

    // On bloque le quota seulement si ce n'est PAS un formulaire spécial
    if (!isForm && currentCount >= 5) {
      return { success: false, message: "Quota quotidien atteint." };
    }

    // B. LOGIQUE DE JEU (Calculs)
    // On s'assure que le solde précédent est bien un nombre
    const oldBalance = typeof userData.economy.enAttente === 'number' ? userData.economy.enAttente : 0;
    const newBalance = oldBalance + REWARD_AMOUNT;
    
    const newCount = isForm ? currentCount : currentCount + 1; // On n'incrémente pas le compteur quotidien pour les formulaires
    
    const updates = {
      "economy.enAttente": newBalance,
      "game.dailyCount": newCount,
      "game.lastQuestionDate": today,
      // On sauvegarde dans l'historique des réponses
      "game.answers": admin.firestore.FieldValue.arrayUnion({
          questionId: questionData.id || "unknown",
          // --- CORRECTION 3 : Eviter 'undefined' pour Firestore ---
          question: labelText, 
          reponse: answer, // Peut être un string ou un JSON stringifié
          tag: questionData.tag || (isForm ? "DOSSIER" : "GENERAL"),
          date: new Date().toISOString()
      })
    };

    // C. UPDATE PROFIL (targetField) - Uniquement pour les questions simples
    if (questionData.targetField) {
        updates[questionData.targetField] = answer;
    }

    transaction.update(userRef, updates);

    // D. Log Historique Financier
    transaction.set(historyRef, {
      type: 'gain',
      label: isForm ? `Dossier: ${labelText}` : `Mission ${questionData.tag || 'Standard'}`,
      montant: REWARD_AMOUNT,
      date: new Date().toISOString()
    });

    return { success: true, reward: REWARD_AMOUNT, message: "Données transmises." };
  });
});

// --- 2. FONCTION ADMIN ---
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

    // Sécurisation des nombres
    const currentEnAttente = typeof userData.economy.enAttente === 'number' ? userData.economy.enAttente : 0;
    const currentGagneTotal = typeof userData.economy.gagneTotal === 'number' ? userData.economy.gagneTotal : 0;
    const montantTransaction = parseInt(withdrawalData.montant || 0, 10);

    if (action === 'approve') {
      const newEnAttente = currentEnAttente - montantTransaction;
      const newGagneTotal = currentGagneTotal + montantTransaction;
      
      transaction.update(userRef, {
        "economy.enAttente": newEnAttente < 0 ? 0 : newEnAttente,
        "economy.gagneTotal": newGagneTotal,
        "economy.statutRetrait": "none"
      });
      transaction.update(withdrawalRef, { statut: 'approved', processedAt: new Date().toISOString() });
      transaction.set(userRef.collection("history").doc(), { type: 'admin', label: 'Virement validé', montant: montantTransaction, date: new Date().toISOString() });
    } else if (action === 'reject') {
      transaction.update(userRef, { "economy.statutRetrait": "none" });
      transaction.update(withdrawalRef, { statut: 'rejected', processedAt: new Date().toISOString() });
      transaction.set(userRef.collection("history").doc(), { type: 'admin', label: 'Virement refusé', montant: 0, date: new Date().toISOString() });
    }
    return { success: true };
  });
});