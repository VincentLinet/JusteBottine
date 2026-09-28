module.exports = {
  apps: [
    {
      name: "justebottine",
      script: "dist/main.cjs",
      interpreter: "yarn",
      interpreter_args: "node",
      autorestart: true,
      restart_delay: 100,
      max_restarts: 20,
      exp_backoff_restart_delay: 100,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production"
      }
    }
  ],

  deploy: {
    production: {
      // SSH alias: the real host and user are defined in ~/.ssh/config, see README
      host: "justebottine",
      ref: "origin/main",
      repo: "git@github.com:VincentLinet/JusteBottine.git",
      path: "/home/vincent/apps/justebottine",
      "post-deploy":
        "yarn install --immutable && yarn build && pm2 startOrReload ecosystem.config.cjs --env production --only justebottine && pm2 save"
    }
  }
};
