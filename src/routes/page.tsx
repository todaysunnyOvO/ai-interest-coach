import { Helmet } from '@modern-js/runtime/head';
import { Chat } from '../components/Chat';
import './index.css';

const Index = () => (
  <>
    <Helmet>
      <title>AI Chat</title>
    </Helmet>
    <Chat />
  </>
);

export default Index;
