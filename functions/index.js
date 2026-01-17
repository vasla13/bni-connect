const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Cette fonction s'exécute sur les serveurs de Google, hors de portée des hackers
exports.submitTask = functions.https.onCall(async (data, context) => {
  // 1. Vérifier que l'utilisateur est connecté
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Vous devez être connecté.');
  }

  const uid = context.auth.uid;
  const userRef = admin.firestore().collection("users").doc(uid);
  const today = new Date().toLocaleDateString('fr-FR');
  const REWARD_AMOUNT = 50; // Le montant est fixé ici, impossible à modifier par le client

  // 2. Lancer une transaction (opération atomique sécurisée)
  return admin.firestore().runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Utilisateur inconnu.');
    }

    const userData = userDoc.data();
    
    // Récupérer le compteur actuel
    let currentCount = 0;
    if (userData.game && userData.game.lastQuestionDate === today) {
      currentCount = userData.game.dailyCount || 0;
    }

    // 3. VÉRIFICATION DU QUOTA (Le Gardien)
    if (currentCount >= 5) {
      // Si quota atteint, on renvoie une erreur ou un succès avec 0 gain
      return { success: false, message: "Quota quotidien atteint.", newBalance: userData.economy.enAttente };
    }

    // 4. Application des gains
    const newBalance = (userData.economy.enAttente || 0) + REWARD_AMOUNT;
    const newCount = currentCount + 1;

    // Mise à jour de la base de données
    transaction.update(userRef, {
      "economy.enAttente": newBalance,
      "game.dailyCount": newCount,
      "game.lastQuestionDate": today,
      // On peut ajouter un historique ici si besoin
    });

    return { 
      success: true, 
      reward: REWARD_AMOUNT, 
      newBalance: newBalance,
      message: "Tâche validée !" 
    };
  });
});