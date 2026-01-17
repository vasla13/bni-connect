// src/data/questions.js

export const RANDOM_QUESTIONS = [
  {
    id: 1,
    text: "Quelle est votre opinion sur l'augmentation des implants cybernétiques au travail ?",
    type: "random",
    reward: 50,
    sensitive: true,
    tag: "ETHIQUE",
    options: ["Favorable (Productivité)", "Neutre", "Contre (Humanité)"]
  },
  {
    id: 2,
    text: "Avez-vous remarqué des activités suspectes dans le secteur B4 cette semaine ?",
    type: "random",
    reward: 50,
    sensitive: true,
    tag: "SECURITE",
    options: ["Oui, souvent", "Non, rien à signaler", "Je préfère ne pas répondre"]
  },
  {
    id: 3,
    text: "Évaluation de votre niveau de stress actuel (1-5) :",
    type: "random",
    reward: 50,
    sensitive: false,
    options: ["1 - Calme", "3 - Modéré", "5 - Critique"]
  },
  {
    id: 4,
    text: "Consommez-vous des produits de la marque 'Synthetix' ?",
    type: "random",
    reward: 50,
    sensitive: true,
    tag: null, // Sensible sans tag
    options: ["Quotidiennement", "Rarement", "Jamais"]
  },
  {
    id: 5,
    text: "Etes-vous satisfait des services de nettoyage robotisés ?",
    type: "random",
    reward: 50,
    sensitive: false,
    options: ["Oui", "Non"]
  }
];