import { Exercise } from './types';

export const EXERCISES: Exercise[] = [
  // Beginner (初级)
  {
    id: 'b1',
    title: 'Greeting a Friend (问候朋友)',
    durationString: '0:12',
    durationSeconds: 12,
    text: 'Hello my friend, how are you doing today? It is so nice to see you here!',
    level: 'beginner',
    levelLabel: '初级'
  },
  {
    id: 'b2',
    title: 'Self Introduction (自我介绍)',
    durationString: '0:15',
    durationSeconds: 15,
    text: 'Hi, my name is Alex. I am twenty years old and I love reading books.',
    level: 'beginner',
    levelLabel: '初级'
  },
  {
    id: 'b3',
    title: 'Ordering Food (餐厅点餐)',
    durationString: '0:18',
    durationSeconds: 18,
    text: 'Can I have a cup of hot coffee and a fresh chocolate muffin, please?',
    level: 'beginner',
    levelLabel: '初级'
  },

  // Intermediate (中级)
  {
    id: 'i1',
    title: 'Plans for the Weekend (周末计划)',
    durationString: '0:26',
    durationSeconds: 26,
    text: 'This weekend, I am planning to go hiking in the mountains with my family. I hope the weather stays warm and sunny so we can enjoy the view.',
    level: 'intermediate',
    levelLabel: '中级'
  },
  {
    id: 'i2',
    title: 'Daily Routine (日常生活)',
    durationString: '0:29',
    durationSeconds: 29,
    text: 'Every morning, I wake up at six sharp. I usually make a simple breakfast, drink some green tea, and quickly check the morning news before starting my work.',
    level: 'intermediate',
    levelLabel: '中级'
  },
  {
    id: 'i3',
    title: 'Traveling by Train (火车旅行)',
    durationString: '0:25',
    durationSeconds: 25,
    text: 'Taking the train is one of my favorite ways to travel because I can read peacefully while observing the beautiful scenery outside passing by.',
    level: 'intermediate',
    levelLabel: '中级'
  },

  // Advanced (高级)
  {
    id: 'a1',
    title: 'The Challenge of Climate Change (气候变化的挑战)',
    durationString: '0:42',
    durationSeconds: 42,
    text: 'Climate change poses an unprecedented threat for global ecosystems and human societies alike. Addressing this massive global challenge requires immediate, coordinated action across all nation states, transitioning rapidly to sustainable green energy sources and minimizing carbon output.',
    level: 'advanced',
    levelLabel: '高级'
  },
  {
    id: 'a2',
    title: 'Artificial Intelligence Future (人工智能的前景)',
    durationString: '0:45',
    durationSeconds: 45,
    text: 'The rapid evolution of artificial intelligence has sparked intense debate regarding ethical boundaries and workplace automation. While AI holds tremendous potential to revolutionize medicine and science, we must carefully govern its power to prevent societal biases and protect personal data.',
    level: 'advanced',
    levelLabel: '高级'
  },
  {
    id: 'a3',
    title: 'The Essence of Lifelong Learning (终身学习的本质)',
    durationString: '0:39',
    durationSeconds: 39,
    text: 'Lifelong learning is not merely a professional necessity but a profound philosophy of curiosity and intellectual growth. By continuously challenging our pre-existing beliefs, we expand our minds and remain adaptable in an ever-fluctuating global landscape.',
    level: 'advanced',
    levelLabel: '高级'
  }
];
