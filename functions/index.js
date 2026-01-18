const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ region: "us-central1" });

// --- 1. FONCTION JEU & UPDATE PROFIL SÉCURISÉE ---
exports.submitTask = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Identité introuvable.');

  // MODIFICATION SÉCURITÉ : On ne récupère que l'ID et la réponse.
  // On ignore le montant envoyé par le client.
  const { answer, questionId } = data; 
  
  if (!questionId) throw new HttpsError('invalid-argument', 'ID de question manquant.');

  const db = admin.firestore();
  const uid = auth.uid;
  const userRef = db.collection("users").doc(uid);
  const historyRef = userRef.collection("history").doc(); 
  
  const today = new Date().toLocaleDateString('fr-FR');

  return db.runTransaction(async (transaction) => {
    // 1. RÉCUPÉRATION DE LA TÂCHE DEPUIS LA SOURCE FIABLE (DB)
    // On cherche d'abord dans les tâches rapides, sinon dans les formulaires
    const taskRef = db.collection("rapid_tasks").doc(questionId);
    const formRef = db.collection("forms").doc(questionId);

    const taskDoc = await transaction.get(taskRef);
    const formDoc = await transaction.get(formRef);

    let trustedData = null;
    let isForm = false;

    if (taskDoc.exists) {
        trustedData = taskDoc.data();
        isForm = false;
    } else if (formDoc.exists) {
        trustedData = formDoc.data();
        isForm = true;
    } else {
        // Cas spécial : Tâche générée par le système (ex: fallback) ou triche
        // On autorise mais avec une récompense de 0 par sécurité si non trouvé
        trustedData = { reward: 0, title: "Tâche inconnue", tag: "UNKNOWN" };
    }

    // 2. DÉFINITION DE LA RÉCOMPENSE (Source Serveur)
    const REWARD_AMOUNT = parseInt(trustedData.reward || 0, 10);
    const labelText = trustedData.title || trustedData.text || "Mission";

    // 3. VÉRIFICATION UTILISATEUR
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) throw new HttpsError('not-found', 'Utilisateur inconnu.');

    const userData = userDoc.data();
    
    // A. Vérification Quota
    let currentCount = 0;
    if (userData.game && userData.game.lastQuestionDate === today) {
      currentCount = userData.game.dailyCount || 0;
    }

    if (!isForm && currentCount >= 5) {
      return { success: false, message: "Quota quotidien atteint." };
    }

    // B. LOGIQUE DE JEU
    const oldBalance = typeof userData.economy.enAttente === 'number' ? userData.economy.enAttente : 0;
    const newBalance = oldBalance + REWARD_AMOUNT;
    const newCount = isForm ? currentCount : currentCount + 1;
    
    const updates = {
      "economy.enAttente": newBalance,
      "game.dailyCount": newCount,
      "game.lastQuestionDate": today,
      "game.answers": admin.firestore.FieldValue.arrayUnion({
          questionId: questionId,
          question: labelText, 
          reponse: answer,
          tag: trustedData.tag || (isForm ? "DOSSIER" : "GENERAL"),
          date: new Date().toISOString()
      })
    };

    // C. UPDATE PROFIL (targetField)
    // Sécurisé car trustedData vient de la DB, pas du client
    if (trustedData.targetField) {
        updates[trustedData.targetField] = answer;
    }

    transaction.update(userRef, updates);

    // D. Log Historique Financier
    if (REWARD_AMOUNT > 0) {
        transaction.set(historyRef, {
        type: 'gain',
        label: isForm ? `Dossier: ${labelText}` : `Mission ${trustedData.tag || 'Standard'}`,
        montant: REWARD_AMOUNT,
        date: new Date().toISOString()
        });
    }

    return { success: true, reward: REWARD_AMOUNT, message: "Données transmises et validées." };
  });
});

// --- 2. FONCTION ADMIN (Inchangée mais incluse pour copie complète) ---
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