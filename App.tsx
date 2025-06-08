import {
  Button,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Easing,
  Modal,
  Clipboard,
  ToastAndroid,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { model } from '~/utils/config-gemni';
import {
  ArrowUpFromDot,
  CameraIcon,
  File,
  GalleryHorizontal,
  Menu,
  Plus,
  SquarePen,
} from 'lucide-react-native';
import './global.css';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<any>([]);
  const [showModal, setShowModal] = useState(false);
  const opacityAnim = useRef(new Animated.Value(0)).current;

  function formatMessage(text: string) {
    return text.split(/(```[\s\S]*?```|`[^`]+`|\*\*([^*]+)\*\*|https?:\/\/[^\s]+)/g).map((part, index) => {
      if (part?.startsWith('```') && part.endsWith('```')) {
        return (
          <Text key={index} className="bg-gray-200 p-2 rounded text-black font-mono">
            {part.replace(/```/g, '')}
          </Text>
        );
      } else if (part?.startsWith('`') && part.endsWith('`')) {
        return <Text key={index} className="font-bold text-black">{part.replace(/`/g, '')}</Text>;
      } else if (part?.startsWith('http')) {
        return (
          <Text key={index} className="text-blue-500 underline" onPress={() => Linking.openURL(part)}>
            {part}
          </Text>
        );
      } else if (part?.startsWith('**') && part.endsWith('**')) {
        return <Text key={index} className="bg-blue-400 px-1 text-white font-bold">{part.replace(/\*\*/g, '')}</Text>;
      }
      return part;
    });
  }

  async function GenerateText() {
    if (!inputText.trim()) return;

    setShowModal(true); // Exibir modal ao enviar mensagem
    const userMessage = { text: inputText, sender: 'user' };
    setMessages((prev: any) => [...prev, userMessage]);
    setInputText('');

    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();

    try {
      const result = await model.generateContent([userMessage.text]);
      const botMessage = result.response.text();

      setShowModal(false); // Fechar modal antes de iniciar o efeito de digitação
      typeTextEffect(botMessage);
    } catch (error) {
      console.error('Erro ao gerar resposta:', error);
      setShowModal(false);
    }
  }

  function typeTextEffect(fullText: string) {
    let index = 0;
    const newMessage = { text: '', sender: 'bot' };

    setMessages((prev: any) => [...prev, newMessage]);

    const interval = setInterval(() => {
      if (index < fullText.length) {
        setMessages((prev: any) => {
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1].text += fullText[index];
          return updatedMessages;
        });
        index++;
      } else {
        clearInterval(interval);
      }
    }, 20); // Velocidade do efeito de digitação
  }

  function copyToClipboard(text: string) {
    Clipboard.setString(text);
    ToastAndroid.show('Texto copiado!', ToastAndroid.SHORT);
  }

  return (
    <View className="h-screen w-full items-center justify-center bg-white">
      <SafeAreaView className="absolute top-0 w-full">
        <View className="mx-6 flex flex-row items-center justify-between">
          <Menu size={30} color={'black'} />
          <Text className="text-xl font-semibold">
            chatGPT <Text className="text-zinc-800">4 {'>'}</Text>
          </Text>
          <SquarePen size={30} color={'black'} />
        </View>
      </SafeAreaView>

      <ScrollView
        className="flex h-full mt-24 mb-24 w-full px-4 py-6"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
        {messages.map((msg: any, index: any) => (
          <Animated.View
            key={index}
            style={{ opacity: opacityAnim }}
            className={`mb-2 max-w-[100%] rounded-xl p-3 `}>
            <View className="flex flex-row items-center gap-2">
              {msg.sender == 'user' ? (
                <View className="h-6 w-6 rounded-full bg-green-300" />
              ) : (
                <Image source={require('./assets/Animation.png')} />
              )}
              <Text className="text-xl font-bold text-black">
                {msg.sender == 'user' ? 'You' : 'chatGPT'}
              </Text>
            </View>
            <TouchableOpacity onLongPress={() => copyToClipboard(msg.text)}>
              <Text className="mt-4">{formatMessage(msg.text)}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      <SafeAreaView className="absolute bottom-0 left-0 w-full bg-white py-2">
        <View className="flex flex-row items-center gap-4 px-4">
          {inputText.length > 0 ? (
            <TouchableOpacity>
              <Plus size={25} color={'black'} />
            </TouchableOpacity>
          ) : (
            <>
              <CameraIcon size={25} color={'black'} />
              <GalleryHorizontal size={25} color={'black'} />
              <File size={25} color={'black'} />
            </>
          )}
          <TextInput
            placeholder="Message"
            value={inputText}
            onChangeText={setInputText}
            className="mx-3 flex-1 rounded-full border border-zinc-400 p-2"
          />
          <TouchableOpacity onPress={GenerateText}>
            <ArrowUpFromDot color={'black'} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* MODAL DE LOADING */}
      <Modal visible={showModal} transparent>
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="bg-white p-4 rounded-lg">
            <Text className="text-lg font-semibold">Gerando resposta...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
