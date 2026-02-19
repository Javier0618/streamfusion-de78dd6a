interface VideoPlayerProps {
  url: string;
  title?: string;
}

const VideoPlayer = ({ url, title }: VideoPlayerProps) => {
  // Check if it's an iframe-embeddable URL or a direct video
  const isIframe = url.includes("embed") || url.includes("youtube") || url.includes("vimeo") || url.includes("iframe");

  if (isIframe) {
    return (
      <div className="relative w-full aspect-video bg-background rounded-lg overflow-hidden">
        <iframe
          src={url}
          title={title || "Video Player"}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-background rounded-lg overflow-hidden">
      <video
        src={url}
        controls
        className="w-full h-full"
        title={title}
        autoPlay
      >
        Tu navegador no soporta el reproductor de video.
      </video>
    </div>
  );
};

export default VideoPlayer;
