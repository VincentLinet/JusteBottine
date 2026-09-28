export default {
  databases: {
    default: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_BASE,
      port: process.env.DB_PORT
    }
  },
  deals: {
    schedule: "0 * * * *",
    timezone: "Europe/Paris",
    // Days before the same product can be announced again in a channel
    cooldown: 30,
    country: "FR",
    locale: "fr",
    steam: {
      types: ["game", "dlc"]
    }
  }
};
