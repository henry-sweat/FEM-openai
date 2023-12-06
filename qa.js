import { openai } from './openai.js';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { CharacterTextSplitter } from 'langchain/text_splitter';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { YoutubeLoader } from 'langchain/document_loaders/web/youtube';

const question = process.argv[2] || 'hi';
const video = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

const createStore = (docs) =>
  MemoryVectorStore.fromDocuments(docs, new OpenAIEmbeddings());

const docsFromYTVideo = (video) => {
  const loader = YoutubeLoader.createFromUrl(video, {
    language: 'en',
    addVideoInfo: true,
  });
  return loader.loadAndSplit(
    new CharacterTextSplitter({
      separator: '',
      chunkSize: 2500,
      chunkOverlap: 100,
    })
  );
};

const docsFromPDF = () => {
  const loader = new PDFLoader(
    'Design_Patterns_-_Elements_of_Reusable_Object-Oriented_Software_-Addison-Wesley_Professional_1994.pdf'
  );
  return loader.loadAndSplit(
    new CharacterTextSplitter({
      separator: '. ',
      chunkSize: 2500,
      chunkOverlap: 200,
    })
  );
};

const loadStore = async () => {
  const videoDocs = await docsFromYTVideo(video);
  const pdfDocs = await docsFromPDF();

  return createStore([...videoDocs, ...pdfDocs]);
};

const query = async () => {
  const store = await loadStore();
  const results = await store.similaritySearch(question, 2);
  console.log('results:', results);

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo-16k',
    temperature: 0,
    messages: [
      {
        role: 'assistant',
        content: 'Answer the following question to the best of your ability.',
      },
      {
        role: 'user',
        content: `Answer the following question using the provided context. If you cannot answer the question with the context, do not lie or make stuff up. Just say that you need more context.
        Question: ${question}
        
        Context: ${results.map((r) => r.pageContent).join('\n')}`,
      },
    ],
  });
  console.log(
    `Answer: ${response.choices[0].message.content}\nSources: ${results
      .map((r) => r.metadata.source)
      .join(', ')}`
  );
};

query();
