import { useCallback, useEffect, useMemo, useState } from 'react';

const PAGE_SIZE = 8;
const TOKEN_KEY = 'blog_access_token';

function Icon({ name, size = 18 }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    back: <><path d="M19 12H5m7 7-7-7 7-7" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z" /><path d="M4 5.5v14A2.5 2.5 0 0 1 6.5 17H20" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    upload: <><path d="M12 16V4m-4 4 4-4 4 4" /><path d="M20 16.5v2A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-2" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.12 2.12 0 0 0-3-3L5 16z" /><path d="M4 20h16" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function formatDate(value, options = { month: 'long', day: 'numeric', year: 'numeric' }) {
  return new Intl.DateTimeFormat('zh-CN', options).format(new Date(value));
}

function initials(name = '') {
  return name.slice(0, 1).toUpperCase() || '友';
}

async function api(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(path, { ...options, headers });
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('blog:unauthorized'));
    }
    throw new Error(result?.msg || `请求失败（${response.status}）`);
  }
  return result?.data;
}

function Avatar({ name, large = false }) {
  return <span className={`avatar${large ? ' avatar-large' : ''}`}>{initials(name)}</span>;
}

function AuthDialog({ mode, onClose, onSuccess, notify }) {
  const [isRegister, setIsRegister] = useState(mode === 'register');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      username: form.get('username'),
      password: form.get('password'),
    };
    setBusy(true);
    try {
      if (isRegister) {
        await api('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      }
      const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
      localStorage.setItem(TOKEN_KEY, result.token);
      onSuccess(result.user);
      notify(isRegister ? '欢迎加入拾页，账号已创建' : '欢迎回来');
      onClose();
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="icon-button dialog-close" onClick={onClose} aria-label="关闭"><Icon name="close" /></button>
        <div className="brand-mark modal-brand">拾</div>
        <p className="eyebrow">你的文字，值得被收藏</p>
        <h2 id="auth-title">{isRegister ? '创建你的空间' : '欢迎回到拾页'}</h2>
        <p className="auth-subtitle">{isRegister ? '注册后即可开始记录与分享。' : '登录后继续书写与探索。'}</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>用户名<input name="username" autoComplete="username" minLength="3" maxLength="32" pattern="[A-Za-z0-9_]+" placeholder="3–32 位字母、数字或下划线" required /></label>
          <label>密码<input name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength="8" placeholder="至少 8 位" required /></label>
          <button className="button button-dark button-wide" disabled={busy}>{busy ? '请稍候…' : isRegister ? '创建账号' : '登录'}</button>
        </form>
        <p className="auth-switch">{isRegister ? '已经有账号？' : '还没有账号？'} <button onClick={() => setIsRegister(!isRegister)}>{isRegister ? '直接登录' : '免费注册'}</button></p>
        <p className="auth-note">账号仅用于本地博客服务，密码经过加密保存。</p>
      </section>
    </div>
  );
}

function ArticleCard({ article, onOpen, featured = false }) {
  const text = article.content.replace(/\s+/g, ' ').trim();
  return (
    <article className={`article-card${featured ? ' article-card-featured' : ''}`} onClick={() => onOpen(article)}>
      <div className="article-card-body">
        <div className="article-meta"><span>{formatDate(article.createdAt)}</span><i /> <span>{article.author.username}</span></div>
        <h3>{article.title}</h3>
        <p>{text.length > 150 ? `${text.slice(0, 150)}…` : text}</p>
        <button className="read-link" onClick={(event) => { event.stopPropagation(); onOpen(article); }}>阅读全文 <Icon name="arrow" size={15} /></button>
      </div>
      {article.coverImageUrl && <div className="article-cover"><img src={article.coverImageUrl} alt="" loading="lazy" /></div>}
    </article>
  );
}

function EditorDialog({ article, onClose, onSaved, notify, token }) {
  const [busy, setBusy] = useState(false);
  const [coverUrl, setCoverUrl] = useState(article?.coverImageUrl || '');
  const [uploading, setUploading] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      notify('请选择 JPG、PNG 或 WebP 图片', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notify('图片不能超过 5 MB', 'error');
      return;
    }
    const body = new FormData();
    body.append('file', file);
    setUploading(true);
    try {
      const result = await api('/api/upload/cover', { method: 'POST', body, token });
      setCoverUrl(result.url);
      notify('封面上传成功');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      title: form.get('title').trim(),
      content: form.get('content'),
      ...(coverUrl ? { coverImageUrl: coverUrl } : {}),
    };
    setBusy(true);
    try {
      const result = await api(article ? `/api/articles/${article.id}` : '/api/articles', {
        method: article ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
        token,
      });
      notify(article ? '文章已更新' : '文章已发布');
      onSaved(result);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop editor-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="editor-dialog" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <header className="dialog-header">
          <div><p className="eyebrow">{article ? '继续打磨你的想法' : '把想法写下来'}</p><h2 id="editor-title">{article ? '编辑文章' : '写一篇新文章'}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="关闭"><Icon name="close" /></button>
        </header>
        <form className="editor-form" onSubmit={handleSubmit}>
          <label className="editor-label">标题<input name="title" defaultValue={article?.title || ''} maxLength="200" placeholder="给这篇文章一个标题" required /></label>
          <label className="editor-label">正文<textarea name="content" defaultValue={article?.content || ''} maxLength="1000000" rows="11" placeholder="从一个念头开始写起…" required /></label>
          <div className="cover-control">
            <div className="cover-preview">{coverUrl ? <img src={coverUrl} alt="文章封面预览" /> : <Icon name="spark" size={24} />}</div>
            <div className="cover-copy"><strong>文章封面</strong><span>JPG、PNG 或 WebP，最大 5 MB</span></div>
            <label className="button button-light upload-button"><Icon name="upload" size={16} />{uploading ? '上传中…' : coverUrl ? '更换图片' : '选择图片'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} disabled={uploading} hidden /></label>
          </div>
          <footer className="editor-actions"><button type="button" className="button button-light" onClick={onClose}>取消</button><button className="button button-dark" disabled={busy || uploading}>{busy ? '保存中…' : article ? '保存修改' : '发布文章'}</button></footer>
        </form>
      </section>
    </div>
  );
}

function ArticleDetail({ article, currentUser, onBack, onEdit, onDelete }) {
  const isOwner = currentUser?.id === article.author.id;
  return (
    <article className="article-detail">
      <button className="back-link" onClick={onBack}><Icon name="back" size={16} /> 返回文章列表</button>
      {article.coverImageUrl && <img className="detail-cover" src={article.coverImageUrl} alt="" />}
      <div className="detail-topline"><span className="detail-category">阅读 · 随笔</span><span className="detail-date"><Icon name="clock" size={15} />{formatDate(article.createdAt)}</span></div>
      <h1>{article.title}</h1>
      <div className="detail-author"><Avatar name={article.author.username} /><div><strong>{article.author.username}</strong><span>发布于 {formatDate(article.createdAt)}</span></div>
        {isOwner && <div className="owner-actions"><button className="icon-button" onClick={() => onEdit(article)} aria-label="编辑文章"><Icon name="edit" /></button><button className="icon-button danger-icon" onClick={() => onDelete(article)} aria-label="删除文章"><Icon name="trash" /></button></div>}
      </div>
      <div className="detail-content">{article.content.split('\n').map((paragraph, index) => paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />)}</div>
      <div className="article-endmark"><span /><span /><span /></div>
      <p className="end-note">感谢阅读，愿你在这里找到一点共鸣。</p>
    </article>
  );
}

function App() {
  const [articles, setArticles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [order, setOrder] = useState('desc');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const [editorArticle, setEditorArticle] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const token = localStorage.getItem(TOKEN_KEY);

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const loadArticles = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), order });
      if (keyword) query.set('keyword', keyword);
      const result = await api(`/api/articles?${query}`);
      setArticles(result.items);
      setPagination(result.pagination);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setBusy(false);
    }
  }, [keyword, order, page]);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  useEffect(() => {
    let active = true;
    if (token) {
      api('/api/auth/me', { token }).then((user) => {
        if (active) setCurrentUser(user);
      }).catch(() => {
        if (active) {
          localStorage.removeItem(TOKEN_KEY);
          setCurrentUser(null);
        }
      });
    }
    const onUnauthorized = () => setCurrentUser(null);
    window.addEventListener('blog:unauthorized', onUnauthorized);
    return () => {
      active = false;
      window.removeEventListener('blog:unauthorized', onUnauthorized);
    };
  }, [token]);

  const featuredArticle = useMemo(() => articles[0], [articles]);
  const restArticles = useMemo(() => articles.slice(1), [articles]);

  function search(event) {
    event.preventDefault();
    setPage(1);
    setKeyword(searchValue.trim());
    setSelectedArticle(null);
  }

  function openEditor(article = null) {
    if (!currentUser) {
      setAuthMode('login');
      notify('登录后即可开始写作', 'error');
      return;
    }
    setEditorArticle(article);
    setEditorOpen(true);
  }

  async function saveArticle(saved) {
    setEditorOpen(false);
    setEditorArticle(null);
    setSelectedArticle(saved);
    await loadArticles();
  }

  async function deleteArticle(article) {
    if (!window.confirm(`确定删除《${article.title}》吗？此操作无法撤销。`)) return;
    try {
      await api(`/api/articles/${article.id}`, { method: 'DELETE', token });
      setSelectedArticle(null);
      notify('文章已删除');
      await loadArticles();
    } catch (deleteError) {
      notify(deleteError.message, 'error');
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setCurrentUser(null);
    setSelectedArticle(null);
    notify('已退出登录');
  }

  return (
    <div className="app-shell">
      <header className="mobile-header">
        <button className="icon-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="打开菜单"><Icon name="menu" /></button>
        <a className="mobile-brand" href="#" onClick={(event) => { event.preventDefault(); setSelectedArticle(null); }}>拾页<span>STORYSPACE</span></a>
        <button className="icon-button" onClick={() => setAuthMode('login')} aria-label="登录"><Avatar name={currentUser?.username} /></button>
      </header>

      <aside className={`sidebar${mobileMenu ? ' sidebar-open' : ''}`}>
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setSelectedArticle(null); }}>
          <span className="brand-mark">拾</span><span className="brand-text">拾页<small>STORYSPACE</small></span>
        </a>
        <div className="sidebar-rule" />
        <p className="side-label">发现</p>
        <button className={`nav-item${!selectedArticle ? ' nav-active' : ''}`} onClick={() => { setSelectedArticle(null); setMobileMenu(false); }}><Icon name="book" /><span>全部文章</span><span className="nav-count">{pagination.total}</span></button>
        <div className="sidebar-note"><div className="note-icon"><Icon name="spark" size={17} /></div><p>每一页，都是一个新的开始。</p><span>写下你的所思所想</span></div>
        <div className="sidebar-bottom">
          <div className="sidebar-rule" />
          {currentUser ? <div className="account-row"><Avatar name={currentUser.username} /><div className="account-copy"><strong>{currentUser.username}</strong><span>已登录</span></div><button className="icon-button logout-button" onClick={logout} title="退出登录"><Icon name="logout" size={16} /></button></div> : <button className="sidebar-signin" onClick={() => setAuthMode('login')}>登录以开始写作 <Icon name="arrow" size={15} /></button>}
          <p className="copyright">一个安静的个人写作空间<br />© 2026 拾页</p>
        </div>
      </aside>

      {mobileMenu && <button className="mobile-scrim" onClick={() => setMobileMenu(false)} aria-label="关闭菜单" />}

      <main className="main-content">
        <div className="topbar"><span className="topbar-context">拾页 <span>/</span> {selectedArticle ? '文章阅读' : '灵感与记录'}</span><div className="topbar-actions">
          <form className="search-box" onSubmit={search}><Icon name="search" size={16} /><input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="搜索文章…" aria-label="搜索文章" />{searchValue && <button type="button" onClick={() => { setSearchValue(''); setKeyword(''); setPage(1); }} aria-label="清除搜索"><Icon name="close" size={14} /></button>}</form>
          {currentUser ? <button className="button button-dark top-write" onClick={() => openEditor()}><Icon name="plus" size={16} />写文章</button> : <button className="button button-dark top-write" onClick={() => setAuthMode('login')}>登录 / 注册</button>}
        </div></div>

        {selectedArticle ? <ArticleDetail article={selectedArticle} currentUser={currentUser} onBack={() => setSelectedArticle(null)} onEdit={openEditor} onDelete={deleteArticle} /> : <div className="page-content">
          <section className="page-intro"><div><p className="eyebrow"><span className="eyebrow-dot" /> 一个关于记录的地方</p><h1>把日子写成<br /><em>值得回看的故事。</em></h1><p className="intro-copy">灵感、思考与生活片段。<br />在这里，让每一个想法都有迹可循。</p></div><div className="intro-art" aria-hidden="true"><div className="art-sun" /><div className="art-page"><span /><span /><span /><span /></div><div className="art-leaf">✳</div><div className="art-caption">VOL. 01<br />WRITE YOURSELF</div></div></section>

          <section className="articles-section">
            <div className="section-heading"><div><p className="eyebrow">从这里开始</p><h2>{keyword ? `“${keyword}” 的搜索结果` : '最近的故事'} <span>{pagination.total}</span></h2></div><label className="sort-select">排序 <select value={order} onChange={(event) => { setOrder(event.target.value); setPage(1); }}><option value="desc">最新发布</option><option value="asc">最早发布</option></select></label></div>
            {error ? <div className="empty-state error-state"><div className="empty-icon">!</div><h3>暂时无法加载文章</h3><p>{error}</p><button className="button button-light" onClick={loadArticles}>重试</button></div> : busy ? <div className="loading-state"><span className="spinner" />正在整理故事…</div> : articles.length === 0 ? <div className="empty-state"><div className="empty-icon"><Icon name="book" size={23} /></div><h3>{keyword ? '没有找到相关文章' : '这里还没有文章'}</h3><p>{keyword ? '试试其他关键词，或清除搜索条件。' : '成为第一个写下故事的人吧。'}</p>{keyword ? <button className="button button-light" onClick={() => { setKeyword(''); setSearchValue(''); }}>清除搜索</button> : <button className="button button-dark" onClick={() => openEditor()}><Icon name="plus" size={16} />写下第一篇</button>}</div> : <>
              {featuredArticle && <ArticleCard article={featuredArticle} featured onOpen={setSelectedArticle} />}
              {restArticles.length > 0 && <div className="article-list">{restArticles.map((article) => <ArticleCard key={article.id} article={article} onOpen={setSelectedArticle} />)}</div>}
              {pagination.totalPages > 1 && <div className="pagination"><span>第 {page} 页，共 {pagination.totalPages} 页</span><div><button className="button button-light" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button><button className="button button-light" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>下一页</button></div></div>}
            </>}
          </section>
        </div>}

        <footer className="page-footer"><span>用文字，留住生活的回声。</span><span>拾页 · 一个个人博客</span></footer>
      </main>

      {authMode && <AuthDialog mode={authMode} onClose={() => setAuthMode(null)} onSuccess={setCurrentUser} notify={notify} />}
      {editorOpen && <EditorDialog article={editorArticle} onClose={() => setEditorOpen(false)} onSaved={saveArticle} notify={notify} token={token} />}
      {toast && <div className={`toast toast-${toast.type}`} role="status">{toast.type === 'error' ? '!' : '✓'}<span>{toast.message}</span></div>}
    </div>
  );
}

export default App;
