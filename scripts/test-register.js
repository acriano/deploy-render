// Importação do node-fetch com abordagem moderna
import fetch from 'node-fetch';

// Função para testar o registro de usuário
async function testUserRegistration() {
  console.log('Iniciando teste de registro de usuário...');

  // Dados do usuário de teste
  const userData = {
    username: 'testuser_' + Math.floor(Math.random() * 1000),
    password: 'senha123',
    name: 'Usuário de Teste',
    email: `teste${Math.floor(Math.random() * 10000)}@example.com`,
    phone: '(11) 9 9999-9999',
    role: 'user'
  };

  console.log('Dados do usuário para teste:', {
    ...userData,
    password: '***' // Não mostrar a senha no log
  });

  try {
    // Tentar registrar o usuário
    console.log('Enviando requisição para API...');
    const response = await fetch('http://localhost:5000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log('✅ Usuário registrado com sucesso!');
      console.log('Resposta da API:', responseData);
    } else {
      console.error('❌ Falha ao registrar usuário!');
      console.error('Código de status:', response.status);
      console.error('Resposta da API:', responseData);
    }
  } catch (error) {
    console.error('❌ Erro ao realizar requisição de teste:', error.message);
  }
}

// Executar o teste
testUserRegistration(); 