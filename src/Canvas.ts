import { Tool } from './Tool';
import { InteractionRecord } from './InteractionRecord';
import { isContext } from 'vm';

export class Canvas {
  private canvasElement: HTMLCanvasElement;
  private canvasContext: CanvasRenderingContext2D;

  private imageDataBeforePreview: ImageData;

  constructor() {
    this.createCanvasElement();
  }

  private createCanvasElement() {
    this.canvasElement = document.createElement('canvas');

    this.canvasElement.style.width = '100%';
    this.canvasElement.style.height = '100%';

    this.canvasContext = this.canvasElement.getContext('2d');
  }

  public setSize(width: number, height: number) {
    this.canvasElement.width = width;
    this.canvasElement.height = height;
  }

  public applyTool(tool: Tool, record: InteractionRecord) {
    this.loadBeforePreviewDataAndApplyAction(tool, record);

    this.imageDataBeforePreview = null;
  }

  public previewTool(tool: Tool, record: InteractionRecord) {
    let imageData;

    if (!this.imageDataBeforePreview) {
      imageData = this.getImageData();
    }

    this.loadBeforePreviewDataAndApplyAction(tool, record);

    if (!this.imageDataBeforePreview) {
      this.imageDataBeforePreview = imageData;
    }
  }

  private loadBeforePreviewDataAndApplyAction(tool: Tool, record: InteractionRecord) {
    if (this.imageDataBeforePreview) {
      this.applyImageData(this.imageDataBeforePreview);
    }

    tool.applyToContext(this.context, record);
  }

  public get element() {
    return this.canvasElement;
  }

  public get context() {
    return this.canvasContext;
  }

  public applyImageData(data: ImageData) {
    this.context.putImageData(data, 0, 0);
  }

  public getImageData() {
    return this.context.getImageData(0, 0, this.element.width, this.element.height);
  }
}