async function createAdmin() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/setup-initial-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Administrador',
        usuario: 'admin',
        email: 'admin@admin.com',
        senha: 'admin'
      })
    });
    const data = await res.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

createAdmin();
