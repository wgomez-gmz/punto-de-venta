export class CreatePromotionCarouselDto {
  image: string; // Base64 encoded image
  title?: string;
  description?: string;
  enabled?: boolean;
  startDate?: string;
  endDate?: string;
  order?: number;
}
