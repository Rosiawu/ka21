#import <Foundation/Foundation.h>
#import <ImageIO/ImageIO.h>
#import <Vision/Vision.h>

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        if (argc != 2) {
            fprintf(stderr, "usage: detect-image-faces <image-path>\n");
            return 2;
        }

        NSString *path = [NSString stringWithUTF8String:argv[1]];
        NSURL *url = [NSURL fileURLWithPath:path];
        CGImageSourceRef source = CGImageSourceCreateWithURL((__bridge CFURLRef)url, NULL);
        if (source == NULL) {
            fprintf(stderr, "unable to read image source\n");
            return 3;
        }

        CGImageRef image = CGImageSourceCreateImageAtIndex(source, 0, NULL);
        CFRelease(source);
        if (image == NULL) {
            fprintf(stderr, "unable to decode image\n");
            return 3;
        }

        VNDetectFaceRectanglesRequest *request = [[VNDetectFaceRectanglesRequest alloc] init];
        VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCGImage:image options:@{}];
        NSError *error = nil;
        BOOL succeeded = [handler performRequests:@[request] error:&error];
        CGImageRelease(image);
        if (!succeeded) {
            fprintf(stderr, "face detection failed: %s\n", error.localizedDescription.UTF8String);
            return 4;
        }

        NSMutableArray *faces = [NSMutableArray array];
        for (VNFaceObservation *observation in request.results) {
            CGRect box = observation.boundingBox;
            [faces addObject:@{
                @"x": @(box.origin.x),
                @"y": @(1.0 - box.origin.y - box.size.height),
                @"width": @(box.size.width),
                @"height": @(box.size.height),
                @"confidence": @(observation.confidence)
            }];
        }

        NSData *json = [NSJSONSerialization dataWithJSONObject:faces options:0 error:&error];
        if (json == nil) {
            fprintf(stderr, "unable to encode face results: %s\n", error.localizedDescription.UTF8String);
            return 5;
        }
        fwrite(json.bytes, 1, json.length, stdout);
        fputc('\n', stdout);
    }
    return 0;
}
