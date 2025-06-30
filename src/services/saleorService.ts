import { ApolloClient, InMemoryCache, createHttpLink, gql } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { SaleorContentType, TranslationQueueItem, SaleorConfig, WebhookEvent } from '../types/saleor';

export class SaleorService {
  private config: SaleorConfig;
  private client: ApolloClient<any>;

  constructor(config: SaleorConfig) {
    this.config = config;
    this.setupApolloClient();
  }

  private setupApolloClient() {
    const httpLink = createHttpLink({
      uri: this.config.apiEndpoint,
    });

    const authLink = setContext((_, { headers }) => {
      return {
        headers: {
          ...headers,
          authorization: this.config.authToken ? `Bearer ${this.config.authToken}` : "",
        }
      }
    });

    this.client = new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
    });
  }

  // Content Type Management
  async getContentTypes(): Promise<SaleorContentType[]> {
    return [
      {
        id: 'product',
        name: 'Products',
        enabled: true,
        priority: 'high',
        estimatedCharacters: 500,
        fields: [
          {
            name: 'name',
            type: 'text',
            required: true,
            maxLength: 250,
            preserveFormatting: false,
            validation: [
              { type: 'required', message: 'Product name is required' },
              { type: 'maxLength', value: 250, message: 'Product name must be under 250 characters' }
            ]
          },
          {
            name: 'description',
            type: 'richText',
            required: false,
            preserveFormatting: true,
            validation: [
              { type: 'preserveLinks', message: 'Links must be preserved in translation' }
            ]
          },
          {
            name: 'seoTitle',
            type: 'text',
            required: false,
            maxLength: 60,
            preserveFormatting: false,
            validation: [
              { type: 'maxLength', value: 60, message: 'SEO title should be under 60 characters' }
            ]
          },
          {
            name: 'seoDescription',
            type: 'text',
            required: false,
            maxLength: 160,
            preserveFormatting: false,
            validation: [
              { type: 'maxLength', value: 160, message: 'SEO description should be under 160 characters' }
            ]
          }
        ]
      },
      {
        id: 'category',
        name: 'Categories',
        enabled: true,
        priority: 'medium',
        estimatedCharacters: 200,
        fields: [
          {
            name: 'name',
            type: 'text',
            required: true,
            maxLength: 250,
            preserveFormatting: false,
            validation: [
              { type: 'required', message: 'Category name is required' },
              { type: 'maxLength', value: 250, message: 'Category name must be under 250 characters' }
            ]
          },
          {
            name: 'description',
            type: 'richText',
            required: false,
            preserveFormatting: true,
            validation: []
          },
          {
            name: 'seoTitle',
            type: 'text',
            required: false,
            maxLength: 60,
            preserveFormatting: false,
            validation: [
              { type: 'maxLength', value: 60, message: 'SEO title should be under 60 characters' }
            ]
          }
        ]
      },
      {
        id: 'collection',
        name: 'Collections',
        enabled: true,
        priority: 'medium',
        estimatedCharacters: 300,
        fields: [
          {
            name: 'name',
            type: 'text',
            required: true,
            maxLength: 250,
            preserveFormatting: false,
            validation: [
              { type: 'required', message: 'Collection name is required' }
            ]
          },
          {
            name: 'description',
            type: 'richText',
            required: false,
            preserveFormatting: true,
            validation: []
          }
        ]
      },
      {
        id: 'attribute',
        name: 'Attributes',
        enabled: false,
        priority: 'low',
        estimatedCharacters: 100,
        fields: [
          {
            name: 'name',
            type: 'text',
            required: true,
            maxLength: 250,
            preserveFormatting: false,
            validation: [
              { type: 'required', message: 'Attribute name is required' }
            ]
          }
        ]
      }
    ];
  }

  async updateContentTypeSettings(contentTypeId: string, settings: Partial<SaleorContentType>): Promise<void> {
    // Update content type configuration
    console.log(`Updating content type ${contentTypeId}:`, settings);
  }

  // GraphQL Queries and Mutations
  private readonly GET_PRODUCTS_QUERY = gql`
    query GetProducts($first: Int!, $after: String, $languageCode: LanguageCodeEnum!) {
      products(first: $first, after: $after) {
        edges {
          node {
            id
            name
            description
            seoTitle
            seoDescription
            translation(languageCode: $languageCode) {
              id
              name
              description
              seoTitle
              seoDescription
            }
            updatedAt
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  private readonly UPDATE_PRODUCT_TRANSLATION_MUTATION = gql`
    mutation UpdateProductTranslation($id: ID!, $languageCode: LanguageCodeEnum!, $input: ProductTranslationInput!) {
      productTranslate(id: $id, languageCode: $languageCode, input: $input) {
        errors {
          field
          message
        }
        product {
          id
          translation(languageCode: $languageCode) {
            name
            description
            seoTitle
            seoDescription
          }
        }
      }
    }
  `;

  async crawlContent(contentType: string, targetLanguage: string): Promise<TranslationQueueItem[]> {
    const queueItems: TranslationQueueItem[] = [];
    
    try {
      switch (contentType) {
        case 'product':
          const products = await this.getAllProducts(targetLanguage);
          for (const product of products) {
            if (!product.translation) {
              queueItems.push(this.createQueueItemFromProduct(product, targetLanguage));
            }
          }
          break;
        
        case 'category':
          const categories = await this.getAllCategories(targetLanguage);
          for (const category of categories) {
            if (!category.translation) {
              queueItems.push(this.createQueueItemFromCategory(category, targetLanguage));
            }
          }
          break;
      }
    } catch (error) {
      console.error(`Error crawling ${contentType}:`, error);
      throw error;
    }

    return queueItems;
  }

  private async getAllProducts(languageCode: string): Promise<any[]> {
    const products: any[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;

    while (hasNextPage) {
      const result = await this.client.query({
        query: this.GET_PRODUCTS_QUERY,
        variables: {
          first: this.config.batchSize,
          after: cursor,
          languageCode: languageCode.toUpperCase()
        }
      });

      const edges = result.data.products.edges;
      products.push(...edges.map((edge: any) => edge.node));

      hasNextPage = result.data.products.pageInfo.hasNextPage;
      cursor = result.data.products.pageInfo.endCursor;
    }

    return products;
  }

  private async getAllCategories(languageCode: string): Promise<any[]> {
    // Similar implementation for categories
    return [];
  }

  private createQueueItemFromProduct(product: any, targetLanguage: string): TranslationQueueItem {
    const fields = [
      {
        name: 'name',
        sourceText: product.name,
        characterCount: product.name?.length || 0,
        status: 'pending' as const
      },
      {
        name: 'description',
        sourceText: product.description || '',
        characterCount: product.description?.length || 0,
        status: 'pending' as const
      },
      {
        name: 'seoTitle',
        sourceText: product.seoTitle || '',
        characterCount: product.seoTitle?.length || 0,
        status: 'pending' as const
      },
      {
        name: 'seoDescription',
        sourceText: product.seoDescription || '',
        characterCount: product.seoDescription?.length || 0,
        status: 'pending' as const
      }
    ].filter(field => field.sourceText.length > 0);

    const totalCharacters = fields.reduce((sum, field) => sum + field.characterCount, 0);

    return {
      id: `${product.id}_${targetLanguage}`,
      contentType: 'product',
      entityId: product.id,
      entityName: product.name,
      sourceLanguage: this.config.defaultSourceLanguage,
      targetLanguage,
      fields,
      status: 'pending',
      priority: 'medium',
      characterCount: totalCharacters,
      estimatedTime: Math.ceil(totalCharacters / 100), // Rough estimate: 100 chars per minute
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3
    };
  }

  private createQueueItemFromCategory(category: any, targetLanguage: string): TranslationQueueItem {
    // Similar implementation for categories
    return {} as TranslationQueueItem;
  }

  async syncTranslationToSaleor(queueItem: TranslationQueueItem): Promise<void> {
    try {
      switch (queueItem.contentType) {
        case 'product':
          await this.syncProductTranslation(queueItem);
          break;
        case 'category':
          await this.syncCategoryTranslation(queueItem);
          break;
        case 'collection':
          await this.syncCollectionTranslation(queueItem);
          break;
      }
    } catch (error) {
      console.error(`Error syncing ${queueItem.contentType} translation:`, error);
      throw error;
    }
  }

  private async syncProductTranslation(queueItem: TranslationQueueItem): Promise<void> {
    const translationInput: any = {};
    
    queueItem.fields.forEach(field => {
      if (field.translatedText && field.status === 'completed') {
        translationInput[field.name] = field.translatedText;
      }
    });

    await this.client.mutate({
      mutation: this.UPDATE_PRODUCT_TRANSLATION_MUTATION,
      variables: {
        id: queueItem.entityId,
        languageCode: queueItem.targetLanguage.toUpperCase(),
        input: translationInput
      }
    });
  }

  private async syncCategoryTranslation(queueItem: TranslationQueueItem): Promise<void> {
    // Implementation for category translation sync
  }

  private async syncCollectionTranslation(queueItem: TranslationQueueItem): Promise<void> {
    // Implementation for collection translation sync
  }

  // Webhook handling
  async processWebhookEvent(event: WebhookEvent): Promise<void> {
    console.log('Processing webhook event:', event);
    
    switch (event.type) {
      case 'product.created':
      case 'product.updated':
        await this.handleProductChange(event);
        break;
      case 'category.created':
      case 'category.updated':
        await this.handleCategoryChange(event);
        break;
    }
  }

  private async handleProductChange(event: WebhookEvent): Promise<void> {
    // Create new translation queue items for enabled target languages
    const enabledLanguages = this.config.enabledTargetLanguages;
    
    for (const language of enabledLanguages) {
      // Check if translation exists, if not, add to queue
      const queueItem = await this.createQueueItemFromEntityId('product', event.entityId, language);
      if (queueItem) {
        // Add to translation queue
        console.log(`Added product ${event.entityId} to translation queue for ${language}`);
      }
    }
  }

  private async handleCategoryChange(event: WebhookEvent): Promise<void> {
    // Similar implementation for categories
  }

  private async createQueueItemFromEntityId(contentType: string, entityId: string, targetLanguage: string): Promise<TranslationQueueItem | null> {
    // Fetch entity data and create queue item
    return null;
  }
}

export const saleorService = new SaleorService({
  apiEndpoint: import.meta.env.VITE_SALEOR_API_ENDPOINT || '',
  authToken: import.meta.env.VITE_SALEOR_AUTH_TOKEN || '',
  defaultSourceLanguage: 'en',
  enabledTargetLanguages: ['es', 'fr', 'de'],
  batchSize: 50,
  rateLimitPerMinute: 100,
  autoTranslationEnabled: false,
  autoTranslationRules: [],
  syncSettings: {
    autoSync: false,
    syncInterval: 30,
    conflictResolution: 'manual',
    backupBeforeSync: true
  }
});