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
  // Référence vers la sous-collection historique
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

    // Calculs
    const newBalance = (userData.economy.enAttente || 0) + REWARD_AMOUNT;
    const newCount = currentCount + 1;
    const newTotal = (userData.economy.gagneTotal || 0) + REWARD_AMOUNT;

    // Mise à jour User
    transaction.update(userRef, {
      "economy.enAttente": newBalance,
      "economy.gagneTotal": newTotal, // On met à jour le total pour les grades
      "game.dailyCount": newCount,
      "game.lastQuestionDate": today
    });

    // --- AJOUT DE L'HISTORIQUE ---
    transaction.set(historyRef, {
      type: 'gain',
      label: 'Mission validée',
      montant: REWARD_AMOUNT,
      date: new Date().toISOString()
    });

    return { success: true, reward: REWARD_AMOUNT, message: "Tâche validée !" };
  });
});