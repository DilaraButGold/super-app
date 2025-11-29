import { Pool } from 'pg';

// Docker-compose dosyasında belirlediğimiz bilgileri buraya giriyoruz.
// Gerçek hayatta bunları .env dosyasında saklarız ama şimdilik böyle ilerleyelim.
const pool = new Pool({
    user: 'myuser',
    host: 'localhost',
    database: 'superappdb',
    password: 'mypassword',
    port: 5432,
});

export default pool;