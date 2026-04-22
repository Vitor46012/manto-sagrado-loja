// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, LogOut, Plus, Edit2, Trash2, ShoppingCart, 
  Image as ImageIcon, X, Shirt, Trophy, ChevronLeft, 
  ChevronRight, AlertCircle, Search, LayoutGrid, Tag, Check, UploadCloud, Database, AlertTriangle, CheckSquare
} from 'lucide-react';

// --- IMPORTAÇÕES FIREBASE ---
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth'; 
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

// ============================================================================
// SUAS CHAVES DO FIREBASE
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCHqmbCQ3n4fhiqtVoaTeMUDTxlnn5U8Pc",
  authDomain: "manto-sagrado-db.firebaseapp.com",
  projectId: "manto-sagrado-db",
  storageBucket: "manto-sagrado-db.firebasestorage.app",
  messagingSenderId: "194077031299",
  appId: "1:194077031299:web:ce2c16c94240c4bbe2d4b6"
};

// Blindagem para evitar Tela Branca caso o Firebase falhe na inicialização
let app: any;
let auth: any;
let db: any;
let firebaseSetupError: string | null = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e: any) {
  console.error("Erro crítico ao inicializar o Firebase:", e);
  firebaseSetupError = e.message;
}

// --- TIPAGENS (TypeScript) CORRIGIDAS PARA A VERCEL ---
export interface Customization { name: string; number: string; }
export interface Product {
  id: string; name: string; gender: string; sizes: string[];
  price: number; promotionalPrice?: number | null; description: string; images: string[];
}
export interface CartItem {
  cartId: string; product: Product; size: string;
  customization: Customization | null; price: number; quantity: number;
}
export interface ToastState { message: string | null; type: 'success' | 'error'; }

// --- CONFIGURAÇÕES DA LOJA ---
const WHATSAPP_NUMBER = "5511999999999"; 
const ADMIN_CREDENTIALS = { username: "admin", password: "123" };

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'catalog' | 'login' | 'admin'>('catalog'); 
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({ message: null, type: 'success' });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(firebaseSetupError);

  useEffect(() => {
    if (firebaseError) {
      setIsLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err: any) {
        console.error("Erro na autenticação Firebase:", err);
        setFirebaseError(`Erro de conexão com o banco: ${err.message}`);
        setIsLoading(false); 
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [firebaseError]);

  useEffect(() => {
    if (!user || firebaseError || !db) return;
    setIsLoading(true);
    
    try {
      const publicProductsRef = collection(db, 'products');
      const unsubscribe = onSnapshot(publicProductsRef, (snapshot) => {
        const fetchedProducts = snapshot.docs.map(doc => ({
          id: doc.id, ...doc.data()
        })) as Product[];
        fetchedProducts.sort((a, b) => a.name.localeCompare(b.name));
        setProducts(fetchedProducts);
        setIsLoading(false);
        setFirebaseError(null);
      }, (error: any) => {
        console.error("Erro ao buscar produtos:", error);
        setFirebaseError("Erro ao carregar os produtos. Verifique as Regras do Firestore.");
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (e: any) {
      setFirebaseError(`Erro ao ler coleção: ${e.message}`);
      setIsLoading(false);
    }
  }, [user, firebaseError]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: null, type: 'success' }), 4000);
  };

  const addToCart = (product: Product, size: string, customization: Customization | null) => {
    const cartItem: CartItem = {
      cartId: Date.now().toString(), product, size, customization,
      price: product.promotionalPrice ? product.promotionalPrice : product.price, quantity: 1
    };
    setCart([...cart, cartItem]);
    showToast("Adicionado ao carrinho com sucesso!", "success");
  };

  const removeFromCart = (cartId: string) => setCart(cart.filter(item => item.cartId !== cartId));
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  if (firebaseError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-red-500">
          <AlertCircle className="text-red-500 w-16 h-16 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 mb-2">Erro de Conexão</h2>
          <p className="text-sm text-slate-600 mb-6">{firebaseError}</p>
          <div className="text-left bg-slate-100 p-4 rounded-lg text-xs font-mono text-slate-700 overflow-x-auto">
            <p className="font-bold mb-2">Verifique no Firebase:</p>
            <p>1. Ativou o Banco de Dados (Firestore) no modo Teste?</p>
            <p>2. Ativou a Autenticação no modo "Anônimo"?</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-emerald-200">
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-lg border-b-4 border-emerald-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer group" onClick={() => setCurrentView('catalog')}>
            <div className="bg-emerald-500 p-1.5 sm:p-2 rounded-lg group-hover:bg-emerald-400 transition-colors">
              <Shirt className="text-slate-900 w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic leading-tight">Manto<span className="text-emerald-400">Sagrado</span></h1>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium tracking-widest uppercase hidden sm:block">Loja Oficial</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-4">
            {currentView === 'catalog' && (
              <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-emerald-400 hover:text-emerald-300 transition-colors">
                <ShoppingCart size={24} />
                {cart.length > 0 && <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-slate-900">{cart.length}</span>}
              </button>
            )}
            {currentView === 'admin' ? (
              <button onClick={() => { setIsAuthenticated(false); setCurrentView('catalog'); showToast("Sessão encerrada.", "success"); }} className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-white transition-colors bg-slate-800 px-3 py-2 rounded-lg font-bold">
                <LogOut size={16} className="hidden sm:block" /> Sair
              </button>
            ) : (
              <button onClick={() => setCurrentView(isAuthenticated ? 'admin' : 'login')} className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-emerald-400 transition-colors font-bold">
                <Lock size={16} /> <span className="hidden sm:inline">{isAuthenticated ? "Painel" : "Admin"}</span>
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {isLoading && currentView === 'catalog' ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            <p className="text-slate-500 font-bold">Conectando à loja...</p>
          </div>
        ) : (
          <>
            {currentView === 'catalog' && <CatalogView products={products} onAddToCart={addToCart} showToast={showToast} />}
            {currentView === 'login' && (
              <LoginView 
                onLogin={(u: string, p: string) => {
                  if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password) { setIsAuthenticated(true); setCurrentView('admin'); showToast("Bem-vindo ao painel!", "success"); }
                  else { showToast("Usuário ou senha incorretos.", "error"); }
                }} 
                onCancel={() => setCurrentView('catalog')}
              />
            )}
            {currentView === 'admin' && isAuthenticated && <AdminDashboard products={products} showToast={showToast} db={db} />}
          </>
        )}
      </main>

      {isCartOpen && <CartSidebar cart={cart} onClose={() => setIsCartOpen(false)} onRemove={removeFromCart} total={cartTotal} whatsappNumber={WHATSAPP_NUMBER} setCart={setCart} />}

      {toast.message && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 transition-all ${toast.type === 'error' ? 'bg-red-600' : 'bg-slate-900 border-b-4 border-emerald-500'}`}>
          {toast.type === 'error' ? <AlertCircle size={20} /> : <Check className="text-emerald-400" size={20} />}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}

      {currentView === 'catalog' && (
        <footer className="bg-slate-900 text-slate-400 py-10 text-center text-sm border-t border-slate-800 mt-auto">
          <div className="flex justify-center mb-4 opacity-50"><Shirt size={32} /></div>
          <p className="font-medium">© {new Date().getFullYear()} Manto Sagrado. Sua loja especialista em camisas de time.</p>
        </footer>
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE: MODAL DE CONFIRMAÇÃO GENÉRICO
// ==========================================
interface ConfirmModalProps {
  isOpen: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void;
  confirmText?: string; cancelText?: string; isDanger?: boolean;
}
function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar", isDanger = false }: ConfirmModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up">
        <div className={`p-6 flex flex-col items-center text-center ${isDanger ? 'bg-red-50' : 'bg-slate-50'}`}>
          {isDanger ? <AlertTriangle className="text-red-500 mb-3 w-12 h-12" /> : <AlertCircle className="text-emerald-500 mb-3 w-12 h-12" />}
          <h3 className="text-xl font-black text-slate-900 uppercase">{title}</h3>
          <p className="text-slate-600 font-medium mt-2 text-sm">{message}</p>
        </div>
        <div className="p-4 bg-white flex gap-3">
          <button onClick={onCancel} className="w-1/2 py-3 rounded-xl font-bold uppercase text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm">{cancelText}</button>
          <button onClick={onConfirm} className={`w-1/2 py-3 rounded-xl font-black uppercase text-white transition-colors text-sm shadow-lg ${isDanger ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'}`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE DO CARRINHO (SIDEBAR)
// ==========================================
interface CartSidebarProps {
  cart: CartItem[]; onClose: () => void; onRemove: (id: string) => void; total: number;
  whatsappNumber: string; setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}
function CartSidebar({ cart, onClose, onRemove, total, whatsappNumber, setCart }: CartSidebarProps) {
  const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    let text = `Fala, campeão! ⚽ Gostaria de fechar o seguinte pedido:\n\n`;
    cart.forEach((item, index) => {
      text += `*${index + 1}. ${item.product.name}*\n   Tamanho: ${item.size}\n`;
      if (item.customization && (item.customization.name || item.customization.number)) {
        text += `   Personalização: ${item.customization.name || '-'} / N° ${item.customization.number || '-'}\n`;
      }
      text += `   Valor: ${formatPrice(item.price)}\n\n`;
    });
    text += `*Total do Pedido: ${formatPrice(total)}*\n\nAguardo as instruções para pagamento!`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
    setCart([]); onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in-right">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-black text-slate-900 uppercase flex items-center gap-2"><ShoppingCart className="text-emerald-500" /> Carrinho</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
              <ShoppingCart size={48} className="opacity-20" />
              <p className="font-medium text-center">Seu carrinho está vazio.<br/>Adicione algumas camisas!</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.cartId} className="flex gap-4 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                <img src={item.product.images[0] || "https://via.placeholder.com/150"} alt="" className="w-20 h-20 object-cover rounded-lg bg-slate-100" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 leading-tight line-clamp-2">{item.product.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">Tam: <span className="font-bold">{item.size}</span></p>
                    {item.customization && (item.customization.name || item.customization.number) && (
                      <p className="text-[10px] text-emerald-600 font-bold mt-0.5 bg-emerald-50 inline-block px-1.5 py-0.5 rounded">
                        Pers: {item.customization.name} {item.customization.number ? `(${item.customization.number})` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="font-black text-emerald-600">{formatPrice(item.price)}</span>
                    <button onClick={() => onRemove(item.cartId)} className="text-xs font-bold text-red-500 hover:text-red-700 underline">Remover</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 font-bold uppercase text-sm">Total a pagar</span>
              <span className="text-2xl font-black text-slate-900">{formatPrice(total)}</span>
            </div>
            <button onClick={handleCheckout} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-wider py-4 rounded-xl shadow-lg shadow-emerald-500/30 transition-transform active:scale-95 flex justify-center items-center gap-2">
              <ShoppingCart size={20} /> Finalizar no WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// VISÃO DO CATÁLOGO (PÚBLICA)
// ==========================================
interface CatalogProps { products: Product[]; onAddToCart: (p: Product, s: string, c: Customization | null) => void; showToast: (m: string, t?: 'success' | 'error') => void; }
function CatalogView({ products, onAddToCart, showToast }: CatalogProps) {
  const [activeFilter, setActiveFilter] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const filters = ['Masculino', 'Feminino', 'Infantil', 'Unissex'];

  const filteredProducts = products.filter(p => {
    const matchFilter = activeFilter === 'Todos' || p.gender === activeFilter;
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div>
      <div className="max-w-2xl mx-auto mb-6 relative px-2 sm:px-0">
        <div className="absolute inset-y-0 left-2 sm:left-0 pl-4 flex items-center pointer-events-none"><Search className="text-slate-400" size={20} /></div>
        <input type="text" placeholder="Procure por time, jogador, modelo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-10 py-4 rounded-2xl border-2 border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-0 outline-none transition-all font-medium text-slate-700 bg-white sm:text-lg" />
        {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-2 sm:right-0 pr-4 flex items-center text-slate-400 hover:text-red-500"><X size={20} /></button>}
      </div>

      <div className="flex justify-start sm:justify-center gap-2 sm:gap-3 mb-10 overflow-x-auto pb-4 hide-scrollbar px-2 sm:px-0">
        <button onClick={() => setActiveFilter('Todos')} className={`flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-full font-bold text-sm whitespace-nowrap transition-all flex-shrink-0 ${activeFilter === 'Todos' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}`}>
          <LayoutGrid size={18} /> Ver Tudo
        </button>
        {filters.map(filter => (
          <button key={filter} onClick={() => setActiveFilter(filter)} className={`px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-full font-bold text-sm whitespace-nowrap transition-all flex-shrink-0 ${activeFilter === filter ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>{filter}</button>
        ))}
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
          <Shirt className="mx-auto text-slate-200 mb-4" size={64} />
          <h3 className="text-xl sm:text-2xl font-black text-slate-700 mb-2 uppercase">Nenhum manto encontrado</h3>
          <p className="text-slate-500 font-medium">Não achamos camisas com esses filtros no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} showToast={showToast} />
          ))}
        </div>
      )}
    </div>
  );
}

// COMPONENTE: CARTÃO DO PRODUTO 
interface ProductCardProps { product: Product; onAddToCart: (p: Product, s: string, c: Customization | null) => void; showToast: (m: string, t?: 'success' | 'error') => void; }
function ProductCard({ product, onAddToCart, showToast }: ProductCardProps) {
  const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [wantsCustomization, setWantsCustomization] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');

  const images = product.images && product.images.length > 0 ? product.images : ["https://via.placeholder.com/800x800?text=Sem+Foto"];
  const hasDiscount = product.promotionalPrice && product.promotionalPrice < product.price;

  const nextImg = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentImgIdx((prev) => (prev + 1) % images.length); };
  const prevImg = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentImgIdx((prev) => (prev - 1 + images.length) % images.length); };

  const handleAdd = () => {
    if (!selectedSize) return showToast("Por favor, selecione um tamanho antes de prosseguir.", "error");
    const customization = wantsCustomization ? { name: customName, number: customNumber } : null;
    onAddToCart(product, selectedSize, customization);
    setSelectedSize(''); setWantsCustomization(false); setCustomName(''); setCustomNumber('');
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 flex flex-col group relative">
      {hasDiscount && <div className="absolute top-4 right-4 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-lg flex items-center gap-1"><Tag size={12} /> Oferta</div>}
      <div className="relative aspect-square w-full bg-slate-50 overflow-hidden group">
        <img src={images[currentImgIdx]} alt="" className="w-full h-full object-cover object-center mix-blend-multiply transition-transform duration-700 group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/800x800?text=Erro+na+Imagem" }} />
        {images.length > 1 && (
          <>
            <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={20} /></button>
            <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={20} /></button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 px-4 py-3 bg-white overflow-x-auto hide-scrollbar border-b border-slate-50">
          {images.map((img, idx) => (
            <button key={idx} onClick={() => setCurrentImgIdx(idx)} className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${currentImgIdx === idx ? 'border-emerald-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}><img src={img} alt="" className="w-full h-full object-cover mix-blend-multiply" /></button>
          ))}
        </div>
      )}
      <div className="p-5 flex flex-col flex-grow">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{product.gender}</div>
        <h3 className="text-lg font-black text-slate-900 mb-2 leading-tight uppercase line-clamp-2">{product.name}</h3>
        <div className="mt-1 mb-4">
          {hasDiscount ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-emerald-600">{formatPrice(product.promotionalPrice!)}</span>
              <span className="text-sm text-slate-400 line-through font-medium">{formatPrice(product.price)}</span>
            </div>
          ) : (
            <span className="text-2xl font-black text-slate-900">{formatPrice(product.price)}</span>
          )}
        </div>
        <div className="mt-auto pt-4 border-t border-slate-100">
          <span className="block text-xs font-bold text-slate-500 uppercase mb-3">Selecione o Tamanho:</span>
          <div className="flex flex-wrap gap-2 mb-4">
            {product.sizes && product.sizes.length > 0 ? product.sizes.map(size => (
                <button key={size} onClick={() => setSelectedSize(size)} className={`min-w-[44px] h-[44px] flex items-center justify-center rounded-xl text-sm font-bold border-2 transition-all ${selectedSize === size ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>{size}</button>
            )) : <span className="text-sm text-red-500 font-bold bg-red-50 px-3 py-1 rounded-lg">Esgotado</span>}
          </div>
          {selectedSize && (
            <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" checked={wantsCustomization} onChange={(e) => setWantsCustomization(e.target.checked)} className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500" />
                <span className="text-xs font-bold text-slate-700 uppercase">Personalizar Camisa?</span>
              </label>
              {wantsCustomization && (
                <div className="grid grid-cols-3 gap-2 mt-3 animate-fade-in">
                  <div className="col-span-2"><input type="text" placeholder="Nome nas Costas" maxLength={15} value={customName} onChange={(e) => setCustomName(e.target.value.toUpperCase())} className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none uppercase" /></div>
                  <div className="col-span-1"><input type="number" placeholder="Número" max={99} min={0} value={customNumber} onChange={(e) => setCustomNumber(e.target.value)} className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 outline-none text-center" /></div>
                </div>
              )}
            </div>
          )}
          <button onClick={handleAdd} className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black uppercase tracking-wider transition-all duration-300 ${selectedSize ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:-translate-y-1' : 'bg-slate-100 text-slate-400 cursor-pointer hover:bg-slate-200'}`}><ShoppingCart size={18} /> Pôr no Carrinho</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VISÃO DE LOGIN DO ADMIN
// ==========================================
interface LoginViewProps { onLogin: (u: string, p: string) => void; onCancel: () => void; }
function LoginView({ onLogin, onCancel }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onLogin(username, password); };

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden mt-10 sm:mt-20 border border-slate-100">
      <div className="px-6 py-10 sm:px-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-emerald-400 mb-5 shadow-lg rotate-3"><Lock size={32} /></div>
          <h2 className="text-2xl font-black text-slate-900 uppercase">Acesso Restrito</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">Painel de gerenciamento oficial.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div><input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="block w-full px-4 py-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium transition-all" placeholder="Usuário (ex: admin)" /></div>
          <div><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full px-4 py-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium transition-all" placeholder="Senha (ex: 123)" /></div>
          <div className="pt-4 flex flex-col gap-3">
            <button type="submit" className="w-full py-4 rounded-xl font-black uppercase text-white bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">Entrar no Painel</button>
            <button type="button" onClick={onCancel} className="w-full py-4 rounded-xl font-bold uppercase text-slate-600 hover:bg-slate-100 transition-colors">Voltar ao Início</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// VISÃO DO PAINEL DE ADMINISTRAÇÃO
// ==========================================
interface AdminProps { products: Product[]; showToast: (m: string, t?: 'success' | 'error') => void; db: any; }
function AdminDashboard({ products, showToast, db }: AdminProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, type: string | null, data: any }>({ isOpen: false, type: null, data: null });

  const handleRequestDelete = (id: string) => setConfirmDialog({ isOpen: true, type: 'delete', data: id });
  const handleRequestBulkDelete = () => setConfirmDialog({ isOpen: true, type: 'bulk-delete', data: null });

  const executeDelete = async (id: string) => {
    setConfirmDialog({ isOpen: false, type: null, data: null });
    try {
      await deleteDoc(doc(db, 'products', id)); 
      setSelectedProducts(prev => prev.filter(pId => pId !== id));
      showToast("Produto excluído com sucesso!", "success");
    } catch (error: any) { showToast("Erro ao excluir. Verifique a conexão.", "error"); }
  };

  const executeBulkDelete = async () => {
    setConfirmDialog({ isOpen: false, type: null, data: null });
    try {
      const deletePromises = selectedProducts.map(id => deleteDoc(doc(db, 'products', id))); 
      await Promise.all(deletePromises);
      setSelectedProducts([]);
      showToast(`${deletePromises.length} produtos excluídos com sucesso!`, "success");
    } catch (error: any) { showToast("Erro ao excluir produtos em massa.", "error"); }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => e.target.checked ? setSelectedProducts(products.map(p => p.id)) : setSelectedProducts([]);
  const handleSelectOne = (id: string) => selectedProducts.includes(id) ? setSelectedProducts(selectedProducts.filter(pId => pId !== id)) : setSelectedProducts([...selectedProducts, id]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event: ProgressEvent<FileReader>) => {
      const csvData = event.target?.result as string;
      const lines = csvData.split('\n');
      if (lines.length < 2) return showToast("O arquivo CSV parece estar vazio ou inválido.", "error");

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      let importedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const columns = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        let rowObj: Record<string, string> = {};
        headers.forEach((header, index) => {
          let val = columns[index] ? columns[index].trim() : '';
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          rowObj[header] = val;
        });

        const docId = Date.now().toString() + Math.random().toString(36).substring(2);
        const newProd: Product = {
          id: docId,
          name: rowObj['nome'] || 'Produto Sem Nome',
          gender: rowObj['genero'] || 'Masculino',
          sizes: rowObj['tamanhos'] ? rowObj['tamanhos'].split(';') : ['P', 'M', 'G', 'GG'],
          price: parseFloat(rowObj['preco']) || 0,
          promotionalPrice: rowObj['precopromocional'] ? parseFloat(rowObj['precopromocional']) : null,
          description: rowObj['descricao'] || 'Sem descrição.',
          images: rowObj['imagens'] ? rowObj['imagens'].split(';') : ["https://via.placeholder.com/800x800?text=Sem+Foto"]
        };

        try {
          await setDoc(doc(db, 'products', docId), newProd); 
          importedCount++;
        } catch (err: any) { console.error(err); }
      }
      showToast(`${importedCount} produtos importados com sucesso!`, "success");
      if (fileInputRef.current) fileInputRef.current.value = ''; 
    };
    reader.readAsText(file);
  };

  const handleSaveProduct = async (productData: Product) => {
    try {
      const docId = productData.id || Date.now().toString() + Math.random().toString(36).substring(2); 
      const productToSave = { ...productData, id: docId };
      await setDoc(doc(db, 'products', docId), productToSave); 
      showToast(productData.id ? "Produto atualizado!" : "Novo produto cadastrado!", "success");
      setIsFormOpen(false);
    } catch (error: any) { showToast("Erro ao guardar dados.", "error"); }
  };

  return (
    <>
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mb-10">
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black uppercase flex items-center gap-2"><Lock className="text-emerald-400" /> Painel Admin</h2>
              <div className="flex items-center gap-3 mt-2">
                <p className="text-xs sm:text-sm text-slate-400 font-medium">Gestão de estoque e loja.</p>
                <span className="bg-slate-800 text-emerald-400 text-[10px] font-black uppercase px-2 py-1 rounded border border-emerald-900/50 flex items-center gap-1"><Database size={12} /> {products.length} Cadastrados</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <input type="file" accept=".csv" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="flex justify-center items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all border bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-emerald-500 hover:bg-slate-800" title="Sua planilha deve ter as colunas: nome, genero, tamanhos, preco, precopromocional, descricao, imagens. Use ponto e vírgula (;) para separar múltiplos tamanhos ou imagens."><UploadCloud size={16} /> Importar CSV</button>
              <button onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="flex justify-center items-center gap-2 bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-400 transition-colors font-black uppercase tracking-wide text-sm shadow-lg shadow-emerald-500/20"><Plus size={18} /> Adicionar Manual</button>
            </div>
          </div>
          {selectedProducts.length > 0 && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl flex justify-between items-center animate-fade-in">
              <span className="text-sm font-bold text-white flex items-center gap-2"><CheckSquare size={18} className="text-red-400" /> {selectedProducts.length} itens selecionados</span>
              <button onClick={handleRequestBulkDelete} className="bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase px-4 py-2 rounded-lg transition-colors">Excluir Selecionados</button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left w-10"><input type="checkbox" checked={products.length > 0 && selectedProducts.length === products.length} onChange={handleSelectAll} className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer" /></th>
                <th className="px-2 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider hidden sm:table-cell">Gênero / Tam</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Preços</th>
                <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {products.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-16 text-center"><Trophy className="mx-auto text-slate-200 mb-3 w-12 h-12" /><p className="text-slate-500 font-bold">Seu banco de dados está vazio.<br/>Importe uma planilha ou cadastre manualmente!</p></td></tr>
              )}
              {products.map((product) => (
                <tr key={product.id} className={`transition-colors ${selectedProducts.includes(product.id) ? 'bg-emerald-50' : 'hover:bg-slate-50/50'}`}>
                  <td className="px-6 py-4"><input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => handleSelectOne(product.id)} className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer" /></td>
                  <td className="px-2 sm:px-4 py-4">
                    <div className="flex items-center gap-4">
                      <img src={product.images && product.images[0] ? product.images[0] : "https://via.placeholder.com/150"} alt="" className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl object-cover bg-slate-100 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-black text-slate-900 uppercase leading-tight line-clamp-2">{product.name}</div>
                        <div className="sm:hidden mt-1 flex flex-col gap-0.5"><span className="text-[10px] font-bold text-slate-500 uppercase">{product.gender}</span><span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded w-fit">{product.sizes?.join(', ')}</span></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell"><div className="flex flex-col gap-1"><span className="text-xs font-bold text-slate-600 uppercase">{product.gender}</span><span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded w-fit truncate max-w-[150px]">{product.sizes?.join(', ')}</span></div></td>
                  <td className="px-4 sm:px-6 py-4"><div className="flex flex-col">{product.promotionalPrice ? <><span className="text-sm font-black text-emerald-600">R$ {product.promotionalPrice.toFixed(2)}</span><span className="text-[10px] text-slate-400 line-through font-bold">R$ {product.price.toFixed(2)}</span></> : <span className="text-sm font-black text-slate-900">R$ {product.price.toFixed(2)}</span>}</div></td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditingProduct(product); setIsFormOpen(true); }} className="text-blue-600 bg-blue-50 p-2 sm:p-2.5 rounded-lg hover:bg-blue-100 transition-colors"><Edit2 size={18} /></button>
                      <button onClick={() => handleRequestDelete(product.id)} className="text-red-600 bg-red-50 p-2 sm:p-2.5 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && <ProductFormModal product={editingProduct} onSave={handleSaveProduct} onClose={() => setIsFormOpen(false)} showToast={showToast} />}
      
      <ConfirmModal 
        isOpen={confirmDialog.isOpen} title={confirmDialog.type === 'delete' ? 'Excluir Camisa' : 'Excluir Vários'} message={confirmDialog.type === 'delete' ? 'Tem certeza que deseja remover este produto permanentemente?' : `Tem certeza que deseja excluir as ${selectedProducts.length} camisas selecionadas?`}
        isDanger={true} onCancel={() => setConfirmDialog({ isOpen: false, type: null, data: null })}
        onConfirm={() => confirmDialog.type === 'delete' ? executeDelete(confirmDialog.data) : executeBulkDelete()}
      />
    </>
  );
}

// ==========================================
// MODAL DE FORMULÁRIO (ADD/EDIT PRODUTO)
// ==========================================
interface ProductFormProps { product: Product | null; onSave: (p: Product) => void; onClose: () => void; showToast: (m: string, t?: 'success' | 'error') => void; }
function ProductFormModal({ product, onSave, onClose, showToast }: ProductFormProps) {
  const DEFAULT_SIZES = ['P', 'M', 'G', 'GG', 'XG'];
  const KIDS_SIZES = ['2', '4', '6', '8', '10', '12', '14'];

  const [name, setName] = useState(product?.name || '');
  const [gender, setGender] = useState(product?.gender || 'Masculino');
  const [sizes, setSizes] = useState<string[]>(product?.sizes || []);
  const [price, setPrice] = useState<number | string>(product?.price || '');
  const [promotionalPrice, setPromotionalPrice] = useState<number | string>(product?.promotionalPrice || '');
  const [description, setDescription] = useState(product?.description || '');
  const [images, setImages] = useState<string[]>(product?.images && product.images.length > 0 ? product.images : ['']);

  const sizeOptions = gender === 'Infantil' ? KIDS_SIZES : DEFAULT_SIZES;

  const handleToggleSize = (sz: string) => setSizes(sizes.includes(sz) ? sizes.filter(s => s !== sz) : [...sizes, sz]);
  const handleAddImage = () => setImages([...images, '']);
  const handleRemoveImage = (idx: number) => { const newImgs = [...images]; newImgs.splice(idx, 1); if(newImgs.length === 0) newImgs.push(''); setImages(newImgs); };
  const handleImageChange = (idx: number, val: string) => { const newImgs = [...images]; newImgs[idx] = val; setImages(newImgs); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sizes.length === 0) return showToast("Selecione pelo menos um tamanho em estoque.", "error");

    const cleanImages = images.filter(url => url.trim() !== '');
    
    const submitData: Product = {
      id: product ? product.id : '',
      name, gender, sizes, description,
      images: cleanImages.length > 0 ? cleanImages : ["https://via.placeholder.com/800x800?text=Sem+Foto"],
      price: parseFloat(price.toString().replace(',', '.')),
      promotionalPrice: promotionalPrice ? parseFloat(promotionalPrice.toString().replace(',', '.')) : null
    };
    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up sm:animate-none">
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-black text-slate-900 uppercase flex items-center gap-2"><Shirt className="text-emerald-500 w-5 h-5" /> {product ? 'Editar Produto' : 'Cadastrar Camisa'}</h3>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-red-500 shadow-sm"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome / Modelo da Camisa</label><input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-bold text-slate-800" placeholder="Ex: Camisa Real Madrid Home" /></div>
            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Gênero</label><select required value={gender} onChange={e => { setGender(e.target.value); setSizes([]); }} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-bold text-slate-800 bg-white appearance-none"><option value="Masculino">Masculino</option><option value="Feminino">Feminino</option><option value="Infantil">Infantil</option><option value="Unissex">Unissex</option></select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Preço Normal</label><input type="number" required step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-bold text-slate-800" placeholder="189.90" /></div>
              <div><label className="block text-[10px] sm:text-xs font-bold text-emerald-600 uppercase mb-2">Preço Promoção</label><input type="number" step="0.01" value={promotionalPrice || ''} onChange={e => setPromotionalPrice(e.target.value)} className="w-full px-4 py-3 border border-emerald-200 bg-emerald-50 rounded-xl focus:border-emerald-500 outline-none font-bold text-emerald-800" placeholder="Opcional" /></div>
            </div>
            <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
               <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Tamanhos Disponíveis no Estoque</label>
               <div className="flex flex-wrap gap-2">
                 {sizeOptions.map(sz => (
                   <label key={sz} className={`cursor-pointer w-10 h-10 sm:w-12 sm:h-12 flex justify-center items-center rounded-xl border-2 font-black transition-all ${sizes.includes(sz) ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-emerald-300'}`}><input type="checkbox" className="hidden" checked={sizes.includes(sz)} onChange={() => handleToggleSize(sz)} /> {sz}</label>
                 ))}
               </div>
            </div>
            <div className="sm:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descrição</label><textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-medium text-sm text-slate-800" placeholder="Detalhes do tecido, patchs..."></textarea></div>
            <div className="sm:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <div className="flex justify-between items-center"><label className="block text-xs font-bold text-slate-500 uppercase">Imagens (Links da internet)</label><button type="button" onClick={handleAddImage} className="text-xs bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-100 flex gap-1 items-center"><Plus size={14}/> Add Foto</button></div>
              {images.map((url, idx) => (
                <div key={idx} className="flex gap-2 relative">
                  <ImageIcon size={18} className="absolute left-3 top-3.5 text-slate-400" />
                  <input type="url" value={url} onChange={e => handleImageChange(idx, e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm" placeholder="URL da foto (Google, Fornecedor...)" />
                  {images.length > 1 && <button type="button" onClick={() => handleRemoveImage(idx)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"><Trash2 size={18} /></button>}
                </div>
              ))}
            </div>
          </div>
          <div className="pt-6 sm:mt-4 border-t border-slate-100 flex gap-3">
            <button type="button" onClick={onClose} className="w-1/3 py-4 rounded-xl font-bold uppercase text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm">Cancelar</button>
            <button type="submit" className="w-2/3 py-4 rounded-xl font-black uppercase text-white bg-slate-900 hover:bg-slate-800 transition-colors text-sm shadow-lg">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}