const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ region: "us-central1" });

// --- 1. FONCTION JEU (Gère les tâches et le solde en attente) ---
exports.submitTask = onCall(async (request) => {
  const { auth } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Identité introuvable.');

  const uid = auth.uid;
  const userRef = admin.firestore().collection("users").doc(uid);
  const historyRef = userRef.collection("history").doc(); 
  
  const today = new Date().toLocaleDateString('fr-FR');
  const REWARD_AMOUNT = 50;

  return admin.firestore().runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) throw new HttpsError('not-found', 'Utilisateur inconnu.');

    const userData = userDoc.data();
    
    // Vérification Quota
    let currentCount = 0;
    if (userData.game && userData.game.lastQuestionDate === today) {
      currentCount = userData.game.dailyCount || 0;
    }

    if (currentCount >= 5) {
      return { success: false, message: "Quota quotidien atteint." };
    }

    // Calculs (UNIQUEMENT VIRTUEL)
    const newBalance = (userData.economy.enAttente || 0) + REWARD_AMOUNT;
    const newCount = currentCount + 1;
    
    transaction.update(userRef, {
      "economy.enAttente": newBalance,
      "game.dailyCount": newCount,
      "game.lastQuestionDate": today
    });

    transaction.set(historyRef, {
      type: 'gain',
      label: 'Mission validée (En attente)',
      montant: REWARD_AMOUNT,
      date: new Date().toISOString()
    });

    return { success: true, reward: REWARD_AMOUNT, message: "Tâche validée !" };
  });
});

// --- 2. FONCTION ADMIN (Valide ou Refuse les virements) ---
exports.manageWithdrawal = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Accès interdit.');

  const { withdrawalId, action } = data; // action = 'approve' ou 'reject'
  
  const db = admin.firestore();
  const withdrawalRef = db.collection("withdrawals").doc(withdrawalId);

  return db.runTransaction(async (transaction) => {
    const withdrawalDoc = await transaction.get(withdrawalRef);
    if (!withdrawalDoc.exists) throw new HttpsError('not-found', 'Demande introuvable.');
    
    const withdrawalData = withdrawalDoc.data();
    if (withdrawalData.statut && withdrawalData.statut !== 'pending') {
      throw new HttpsError('failed-precondition', 'Cette demande a déjà été traitée.');
    }

    const userId = withdrawalData.userId;
    const amount = withdrawalData.montant;
    const userRef = db.collection("users").doc(userId);
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists) throw new HttpsError('not-found', 'Utilisateur introuvable.');
    const userData = userDoc.data();

    if (action === 'approve') {
      // VALIDER : On déplace l'argent (Attente -> Gagné Total)
      const newEnAttente = (userData.economy.enAttente || 0) - amount;
      const newGagneTotal = (userData.economy.gagneTotal || 0) + amount;

      transaction.update(userRef, {
        "economy.enAttente": newEnAttente < 0 ? 0 : newEnAttente,
        "economy.gagneTotal": newGagneTotal,
        "economy.statutRetrait": "none" // Libère le statut
      });

      transaction.update(withdrawalRef, { 
        statut: 'approved', 
        processedAt: new Date().toISOString() 
      });

      transaction.set(userRef.collection("history").doc(), {
        type: 'admin', label: 'Virement validé par Admin', montant: amount, date: new Date().toISOString()
      });

    } else if (action === 'reject') {
      // REFUSER : On libère juste le statut (l'argent reste en attente)
      transaction.update(userRef, {
        "economy.statutRetrait": "none"
      });

      transaction.update(withdrawalRef, { 
        statut: 'rejected', 
        processedAt: new Date().toISOString() 
      });
      
      transaction.set(userRef.collection("history").doc(), {
        type: 'admin', label: 'Virement refusé (Fonds restitués)', montant: 0, date: new Date().toISOString()
      });
    }

    return { success: true };
  });
});