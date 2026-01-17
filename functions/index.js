const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();

// Force la région us-central1 pour que le client React trouve la fonction
setGlobalOptions({ region: "us-central1" });

exports.submitTask = onCall(async (request) => {
  // En V2, on récupère l'authentification ici
  const { auth } = request;

  // 1. VÉRIFICATION IDENTITÉ
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Vous devez être connecté (Identité introuvable).');
  }

  const uid = auth.uid;
  const userRef = admin.firestore().collection("users").doc(uid);
  const today = new Date().toLocaleDateString('fr-FR');
  const REWARD_AMOUNT = 50;

  // 2. TRANSACTION SÉCURISÉE
  return admin.firestore().runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'Utilisateur inconnu.');
    }

    const userData = userDoc.data();
    
    // Vérification du Quota
    let currentCount = 0;
    if (userData.game && userData.game.lastQuestionDate === today) {
      currentCount = userData.game.dailyCount || 0;
    }

    if (currentCount >= 5) {
      return { success: false, message: "Quota quotidien atteint." };
    }

    // Application des gains
    const newBalance = (userData.economy.enAttente || 0) + REWARD_AMOUNT;
    const newCount = currentCount + 1;

    transaction.update(userRef, {
      "economy.enAttente": newBalance,
      "game.dailyCount": newCount,
      "game.lastQuestionDate": today
    });

    return { 
      success: true, 
      reward: REWARD_AMOUNT, 
      message: "Tâche validée !" 
    };
  });
});