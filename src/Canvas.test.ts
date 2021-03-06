import { Canvas } from './Canvas';
import { InteractionRecord } from './recorders/InteractionRecord';
import { Tool } from './tools/Tool';
import { Mutation } from './interfaces/Mutation';
import { Action } from './interfaces/Action';

class MockTool extends Tool<InteractionRecord> {
    public applyToContext = jest.fn();
}

function createAction(): Action<InteractionRecord> {
    return {
        tool: new MockTool(),
        record: {},
        style: {
            color: '#f00',
        },
    };
}

function createMutation(withCheckpoint: boolean): Mutation {
    return {
        actions: [createAction(), createAction()],
        checkpoint: withCheckpoint ? new ImageData(2, 2) : undefined,
    };
}

function assertMutationActionsWereCalled(mutation: Mutation) {
    mutation.actions.forEach((action) =>
        expect(action.tool.applyToContext).toBeCalled(),
    );
}

describe('Canvas', () => {
    let canvas = new Canvas();
    let actionToPreview: Action<InteractionRecord>;

    beforeEach(() => {
        canvas = new Canvas();
        actionToPreview = createAction();
    });

    test('should provide canvas html element with right styles', () => {
        expect(canvas.element.getContext).toBeDefined();
        expect(canvas.element.style.width).toBe('100%');
        expect(canvas.element.style.height).toBe('100%');
    });

    test('should provide canvas context', () => {
        expect(canvas.context).toBeDefined();
    });

    test('setSize should set size', () => {
        canvas.setSize(200, 300);

        expect(canvas.element.width).toBe(200);
        expect(canvas.element.height).toBe(300);
    });

    test('should should put image data to context when applying image data', () => {
        canvas.applyImageData(canvas.getImageData());

        expect(canvas.context.putImageData).toBeCalled();
    });

    test('should access current image data and apply action to context on previewAction', () => {
        canvas.previewAction(actionToPreview);

        expect(actionToPreview.tool.applyToContext).toBeCalled();
        expect(canvas.context.getImageData).toBeCalled();
    });

    test('should put image data on applyMutation without checkpoint after previewAction', () => {
        const mutation = createMutation(false);

        canvas.previewAction(actionToPreview);
        canvas.applyMutation(mutation);

        assertMutationActionsWereCalled(mutation);
        expect(canvas.context.putImageData).toBeCalled();
    });

    test('should put image data on previewAction after previewAction', () => {
        canvas.previewAction(actionToPreview);
        canvas.previewAction(actionToPreview);

        expect(actionToPreview.tool.applyToContext).toBeCalled();
        expect(canvas.context.putImageData).toBeCalled();
    });

    test('should access image data only once on consequent previewAction', () => {
        canvas.previewAction(actionToPreview);
        canvas.previewAction(actionToPreview);

        expect(actionToPreview.tool.applyToContext).toBeCalled();
        expect(canvas.context.getImageData).toBeCalledTimes(1);
    });

    test('should not put image data on second applyMutation without checkpoint after previewAction', () => {
        const mutation1 = createMutation(false);
        const mutation2 = createMutation(false);

        canvas.previewAction(actionToPreview);
        canvas.applyMutation(mutation1);
        canvas.applyMutation(mutation2);

        expect(canvas.context.putImageData).toBeCalledTimes(1);
    });

    test('should put image data once on applyMutation with checkpoint after previewAction', () => {
        const mutation = createMutation(true);

        canvas.previewAction(actionToPreview);
        canvas.applyMutation(mutation);

        expect(canvas.context.putImageData).toBeCalledTimes(1);
    });

    test('should put image data with checkpoint and apply actions on applyMutation with checkpoint', () => {
        const mutation = createMutation(true);

        canvas.applyMutation(mutation);

        assertMutationActionsWereCalled(mutation);
        expect(canvas.context.putImageData).toBeCalledWith(
            mutation.checkpoint,
            0,
            0,
        );
    });

    test('should set stroke and fill style after set style', () => {
        canvas.setStyle({
            color: '#f0f',
            lineWidth: 7,
        });
        actionToPreview.style = {};

        canvas.previewAction(actionToPreview);

        const passedContext: CanvasRenderingContext2D =
            // @ts-ignore
            actionToPreview.tool.applyToContext.mock.calls[0][0];

        expect(passedContext.strokeStyle).toBe('#f0f');
        expect(passedContext.fillStyle).toBe('#f0f');
        expect(passedContext.lineWidth).toBe(7);
    });

    test('should set stroke and fill colors passed with action', () => {
        canvas.setStyle({ color: '#ff00ff', lineWidth: 7 });
        canvas.previewAction(actionToPreview);

        const passedContext: CanvasRenderingContext2D =
            // @ts-ignore
            actionToPreview.tool.applyToContext.mock.calls[0][0];

        expect(passedContext.strokeStyle).toBe(actionToPreview.style.color);
        expect(passedContext.fillStyle).toBe(actionToPreview.style.color);
        expect(passedContext.lineWidth).toBe(7);
    });
});
