const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ region: "us-central1" });

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

    // --- CALCULS STRICTS ---
    // On ajoute 50$ SEULEMENT au solde "En attente" (Virtuel)
    const newBalance = (userData.economy.enAttente || 0) + REWARD_AMOUNT;
    const newCount = currentCount + 1;
    
    // NOTE IMPORTANTE : On ne lit même pas 'gagneTotal' ici pour être sûr de ne pas le toucher.

    // Mise à jour BDD
    transaction.update(userRef, {
      "economy.enAttente": newBalance,
      // "economy.gagneTotal": ... <= CETTE LIGNE N'EXISTE PLUS
      "game.dailyCount": newCount,
      "game.lastQuestionDate": today
    });

    // Ajout historique
    transaction.set(historyRef, {
      type: 'gain',
      label: 'Mission validée (En attente)',
      montant: REWARD_AMOUNT,
      date: new Date().toISOString()
    });

    return { success: true, reward: REWARD_AMOUNT, message: "Tâche validée !" };
  });
});