import { html } from 'hono/html';

export const AdminLogin = () => {
  return html`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>管理员登录 - 看图网站</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                primary: '#4A90E2'
              }
            }
          }
        }
      </script>
    </head>
    <body class="bg-gray-50 min-h-screen flex items-center justify-center">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            管理员登录
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            请使用管理员账户登录
          </p>
        </div>
        
        <div class="bg-white py-8 px-6 shadow rounded-lg">
          <form id="loginForm" class="space-y-6">
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700">
                用户名
              </label>
              <div class="mt-1">
                <input 
                  id="username" 
                  name="username" 
                  type="text" 
                  required 
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="请输入用户名"
                  value="admin"
                >
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">
                密码
              </label>
              <div class="mt-1">
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="请输入密码"
                  value="admin123"
                >
              </div>
            </div>

            <div>
              <button 
                type="submit" 
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                登录
              </button>
            </div>
          </form>
          
          <div id="message" class="mt-4 text-center text-sm hidden"></div>
        </div>
        
        <div class="text-center">
          <a href="/" class="text-primary hover:text-primary/80">
            返回首页
          </a>
        </div>
      </div>

      <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;
          const messageEl = document.getElementById('message');
          
          try {
            const response = await fetch('/admin/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
              messageEl.className = 'mt-4 text-center text-sm text-green-600';
              messageEl.textContent = '登录成功，正在跳转...';
              messageEl.classList.remove('hidden');
              
              // 存储token到localStorage
              localStorage.setItem('admin-token', data.token);
              
              // 跳转到管理后台
              setTimeout(() => {
                window.location.href = '/admin/dashboard';
              }, 1000);
            } else {
              messageEl.className = 'mt-4 text-center text-sm text-red-600';
              messageEl.textContent = data.message || '登录失败';
              messageEl.classList.remove('hidden');
            }
          } catch (error) {
            messageEl.className = 'mt-4 text-center text-sm text-red-600';
            messageEl.textContent = '网络错误，请重试';
            messageEl.classList.remove('hidden');
          }
        });
      </script>
    </body>
    </html>
  `;
};
