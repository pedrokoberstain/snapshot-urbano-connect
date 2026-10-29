import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validarSessao = async () => {
      const token = localStorage.getItem('token');
      
      // Se não tem token, já sabemos que não está logado
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Bate no back-end para pegar a verdade absoluta sobre o plano do usuário
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.ok) {
          const dadosAtualizados = await res.json();
          setUser(dadosAtualizados);
          
          // Atualiza a "foto" no cache para as outras páginas não precisarem carregar
          localStorage.setItem('user', JSON.stringify(dadosAtualizados));
        } else {
          // Se o token expirou ou deu erro 403/401, limpamos tudo
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        console.error("Erro ao validar sessão com o servidor:", error);
        
        // Plano B: Se a internet piscar, tenta usar o que está salvo no cache para não derrubar o usuário atoa
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setLoading(false);
      }
    };

    validarSessao();
  }, []);

  return {
    user,
    loading,
    isAdmin: user?.tipo === 'ADMIN',
    isPro: user?.plano === 'PRO' || user?.tipo === 'ADMIN'
  };
}