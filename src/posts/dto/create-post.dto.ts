export class CreatePostDto {
  content: string;

  constructor(createPostDto: Partial<CreatePostDto>) {
    Object.assign(this, createPostDto);
  }
}
