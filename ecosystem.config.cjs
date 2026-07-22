module.exports = {
  apps: [
    {
      name: "qrmenu",
      script: "node",
      args: "--enable-source-maps artifacts/api-server/dist/index.mjs",
      cwd: "/var/www/yorosyeni",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      env: {
        NODE_ENV: "production",
        PORT: "1088",
        DATABASE_URL: "postgresql://qrmenu:QrMenu_Yoros2024!@localhost:5432/qrmenu_db",
        SESSION_SECRET: "BURAYA_OPENSSL_CIKTISI_YAPISTIR",
        DEFAULT_OBJECT_STORAGE_BUCKET_ID: "",
        PRIVATE_OBJECT_DIR: "/var/www/yorosyeni/storage/private",
        PUBLIC_OBJECT_SEARCH_PATHS: "/var/www/yorosyeni/storage/public",
      },
    },
  ],
};
