import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from '@/shared/layouts/MainLayout';
import { useAuthQuerySync } from '@/features/auth/hooks/useAuthSync';
import { useSocialLogin } from '@/features/auth/hooks/useSocialLogin';

// Page Imports
import Login from '@/features/auth/pages/Login';
import Signup from '@/features/auth/pages/Signup';
import Onboarding from '@/features/auth/pages/Onboarding';
import ChatList from '@/features/chat/pages/ChatList';
import ChatRoom from '@/features/chat/pages/ChatRoom';
import MyCarrot from '@/features/user/pages/MyCarrot';
import SellerProfile from '@/features/user/pages/SellerProfile';
import ProductList from '@/features/product/pages/ProductList';
import ProductDetail from '@/features/product/pages/ProductDetail';

function App() {
  
  useAuthQuerySync();
  useSocialLogin();

  return (
    <Routes>
        {/* 모든 페이지를 MainLayout 하나로 통합 */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/products" replace />} />

          {/* 기존 메인 서비스 */}
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/user/:userId" element={<SellerProfile />} />
          <Route path="/chat" element={<ChatList />} />
          <Route path="/chat/:chatId" element={<ChatRoom />} />
          <Route path="/my" element={<MyCarrot />} />
          <Route path="/my/products" element={<MyCarrot initialTab="products" />} />
          <Route path="/my/bids" element={<MyCarrot initialTab="bids" />} />
          <Route path="/my/profile" element={<MyCarrot initialTab="profile" />} />
          <Route path="/my/coin" element={<MyCarrot initialTab="coin" />} />
          <Route path="/my/transactions" element={<MyCarrot initialTab="transactions" />} />

          {/* 인증 페이지도 이곳으로 통합 */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/onboarding" element={<Onboarding />} />
        </Route>
    </Routes>
  );
}

export default App;
