import React, { useState, useEffect, useRef } from 'react';
import {
  Menu, Search, MoreVertical, Folder, ChevronRight, Play, Pause, SkipBack, SkipForward, X,
  Shuffle, Repeat, Heart, Share2, ListMusic, ArrowLeft, Power, SlidersHorizontal,
  Music, MoreHorizontal, BarChart2, Settings, Info, Bell, Shield, Clock, Moon, Sun, MonitorSmartphone,
  ScanSearch, Headphones, Volume2, History, Star
} from 'lucide-react';

export default function App() {
  const [songs, setSongs] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [currentScreen, setCurrentScreen] = useState('library'); // 'library', 'folders', 'nowPlaying', 'more'
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState('dark'); // 'dark', 'light'
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [headsetControls, setHeadsetControls] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsScanning(true);

    const newSongs: any[] = [];
    const newFoldersMap = new Map();

    Array.from(files).forEach((file, index) => {
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|m4a|aac|ogg|flac)$/i)) {
        const url = URL.createObjectURL(file);
        
        const title = file.name.replace(/\.[^/.]+$/, "");
        const artist = "Unknown Artist";
        const cover = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&q=80";

        const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [];
        const folderName = pathParts.length > 1 ? pathParts[pathParts.length - 2] : 'Local Music';
        const folderPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '/Local Music';

        if (!newFoldersMap.has(folderPath)) {
          newFoldersMap.set(folderPath, {
            id: folderPath,
            name: folderName,
            path: folderPath,
            tracks: 0
          });
        }
        newFoldersMap.get(folderPath).tracks += 1;

        newSongs.push({
          id: `local-${Date.now()}-${index}`,
          title,
          artist,
          cover,
          url,
          duration: "",
          folderPath
        });
      }
    });

    if (newSongs.length > 0) {
      setSongs(newSongs);
      setFolders(Array.from(newFoldersMap.values()));
      setCurrentSong(newSongs[0]);
      setShowMiniPlayer(true);
      setIsPlaying(false);
      setCurrentScreen('library');
    }

    setIsScanning(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    fetch('/api/songs').then(r => r.json()).then(data => {
      setSongs(prev => prev.length > 0 ? prev : data);
      if (data.length > 0) {
        setCurrentSong(prev => prev ? prev : data[0]);
        setShowMiniPlayer(prev => prev ? prev : true);
      }
    }).catch(() => {});
    fetch('/api/folders').then(r => r.json()).then(data => {
      setFolders(prev => prev.length > 0 ? prev : data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (audioRef.current && currentSong) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback failed", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (sleepTimer !== null && sleepTimer > 0) {
      const timer = setTimeout(() => {
        setIsPlaying(false);
        setSleepTimer(null);
      }, sleepTimer * 60000);
      return () => clearTimeout(timer);
    }
  }, [sleepTimer]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
      setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100);
    }
  };

  const handleEnded = () => {
    handleNext();
  };

  const handleNext = () => {
    if (!currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentSong(songs[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (!currentSong || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    setCurrentSong(songs[prevIndex]);
    setIsPlaying(true);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pos * audioRef.current.duration;
  };

  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const Drawer = () => (
    <>
      {isDrawerOpen && (
        <div 
          className="absolute inset-0 bg-black/60 z-[60]" 
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
      <div 
        className={`absolute top-0 bottom-0 left-0 w-3/4 max-w-[300px] ${theme === 'light' ? 'bg-white' : 'bg-[#1a1f29]'} z-[70] transition-transform duration-300 ease-in-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col justify-end h-40">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-white font-semibold text-lg">MX Music Player</h2>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <div className={`px-4 py-3 flex items-center gap-4 hover:bg-black/5 cursor-pointer ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`} onClick={() => { setCurrentScreen('library'); setIsDrawerOpen(false); setSelectedFolder(null); }}>
            <Music className={`w-5 h-5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
            <span className="font-medium">Local Music</span>
          </div>
          <div className={`px-4 py-3 flex items-center gap-4 hover:bg-black/5 cursor-pointer ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`} onClick={() => { setCurrentScreen('folders'); setIsDrawerOpen(false); setSelectedFolder(null); }}>
            <Folder className={`w-5 h-5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
            <span className="font-medium">Folders</span>
          </div>
          <div className={`h-px my-2 mx-4 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`} />
          <div className={`px-4 py-3 flex items-center gap-4 hover:bg-black/5 cursor-pointer ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`} onClick={() => { setSleepTimer(sleepTimer ? null : 30); setIsDrawerOpen(false); }}>
            <Clock className={`w-5 h-5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
            <span className="font-medium">Sleep Timer {sleepTimer ? `(${sleepTimer}m)` : ''}</span>
            {sleepTimer && <span className="ml-auto text-xs bg-blue-500/20 text-blue-600 px-2 py-1 rounded">ON</span>}
          </div>
          <div className={`h-px my-2 mx-4 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-800'}`} />
          <div className={`px-4 py-3 flex items-center gap-4 hover:bg-black/5 cursor-pointer ${theme === 'light' ? 'text-gray-800' : 'text-gray-200'}`} onClick={() => { setCurrentScreen('more'); setIsDrawerOpen(false); }}>
            <Settings className={`w-5 h-5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
            <span className="font-medium">Settings</span>
          </div>
        </div>
      </div>
    </>
  );

  const SearchOverlay = () => {
    if (!isSearchOpen) return null;
    return (
      <div className={`absolute inset-0 ${theme === 'light' ? 'bg-gray-50' : 'bg-[#12161e]'} z-[60] flex flex-col`}>
        <div className={`flex items-center p-4 border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'} gap-3`}>
          <ArrowLeft className={`w-6 h-6 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'} cursor-pointer`} onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} />
          <div className={`flex-1 flex items-center ${theme === 'light' ? 'bg-gray-200' : 'bg-[#1e232d]'} rounded-lg px-3 py-2`}>
            <Search className={`w-4 h-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} mr-2`} />
            <input 
              type="text" 
              autoFocus
              placeholder="Search songs, albums, artists..." 
              className={`bg-transparent text-sm ${theme === 'light' ? 'text-gray-900' : 'text-white'} outline-none w-full placeholder-gray-500`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && <X className={`w-4 h-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} cursor-pointer`} onClick={() => setSearchQuery('')} />}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {searchQuery && filteredSongs.length === 0 ? (
            <div className={`text-center mt-10 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>No results found for "{searchQuery}"</div>
          ) : (
            filteredSongs.map(song => (
              <div 
                key={song.id} 
                className={`flex items-center p-3 cursor-pointer rounded-lg ${theme === 'light' ? 'hover:bg-gray-200' : 'hover:bg-[#1e232d]'}`}
                onClick={() => { setCurrentSong(song); setIsPlaying(true); setShowMiniPlayer(true); setIsSearchOpen(false); }}
              >
                <img src={song.cover} alt={song.title} className="w-10 h-10 rounded object-cover" referrerPolicy="no-referrer" />
                <div className="ml-3 flex-1">
                  <h3 className={`text-sm font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{song.title}</h3>
                  <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>{song.artist}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const LibraryScreen = () => (
    <div className={`flex flex-col h-full ${theme === 'light' ? 'bg-gray-50 text-gray-900' : 'bg-[#12161e] text-white'}`}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Menu className={`w-6 h-6 cursor-pointer ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`} onClick={() => setIsDrawerOpen(true)} />
          <h1 className="text-xl font-semibold">Music Library</h1>
        </div>
        <div className="flex items-center gap-4">
          <Search className={`w-6 h-6 cursor-pointer ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`} onClick={() => setIsSearchOpen(true)} />
        </div>
      </div>

      <div className="px-4 mb-4" onClick={() => setIsSearchOpen(true)}>
        <div className={`flex items-center rounded-lg px-4 py-2.5 cursor-pointer ${theme === 'light' ? 'bg-gray-200' : 'bg-[#1e232d]'}`}>
          <Search className={`w-5 h-5 mr-3 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
          <div className={`text-sm w-full ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Search songs, albums, artists</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {songs.map(song => (
          <div 
            key={song.id} 
            className={`flex items-center p-4 cursor-pointer ${theme === 'light' ? 'hover:bg-gray-200' : 'hover:bg-[#1e232d]'}`}
            onClick={() => { setCurrentSong(song); setIsPlaying(true); setShowMiniPlayer(true); }}
          >
            <img src={song.cover} alt={song.title} className="w-12 h-12 rounded-md object-cover" referrerPolicy="no-referrer" />
            <div className="ml-4 flex-1">
              <h3 className={`text-base font-medium ${currentSong?.id === song.id ? 'text-blue-500' : (theme === 'light' ? 'text-gray-900' : 'text-white')}`}>{song.title}</h3>
              <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>{song.artist}</p>
            </div>
            {currentSong?.id === song.id && isPlaying && (
              <BarChart2 className="w-4 h-4 text-blue-500 mr-4" />
            )}
            <span className={`text-xs mr-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>{song.duration}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const FoldersScreen = () => {
    if (selectedFolder) {
      const folderSongs = songs.filter(s => s.folderPath === selectedFolder || (selectedFolder === '/Local Music' && !s.folderPath));
      const folderName = folders.find(f => f.path === selectedFolder)?.name || 'Folder';
      return (
        <div className={`flex flex-col h-full ${theme === 'light' ? 'bg-gray-50 text-gray-900' : 'bg-[#12161e] text-white'}`}>
          <div className={`flex items-center p-4 border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-800/50'}`}>
            <ArrowLeft className={`w-6 h-6 mr-4 cursor-pointer ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`} onClick={() => setSelectedFolder(null)} />
            <h1 className="text-xl font-semibold">{folderName}</h1>
          </div>
          <div className="flex-1 overflow-y-auto pb-32">
            {folderSongs.map(song => (
              <div 
                key={song.id} 
                className={`flex items-center p-4 cursor-pointer ${theme === 'light' ? 'hover:bg-gray-200' : 'hover:bg-[#1e232d]'}`}
                onClick={() => { setCurrentSong(song); setIsPlaying(true); setShowMiniPlayer(true); }}
              >
                <img src={song.cover} alt={song.title} className="w-12 h-12 rounded-md object-cover" referrerPolicy="no-referrer" />
                <div className="ml-4 flex-1">
                  <h3 className={`text-base font-medium ${currentSong?.id === song.id ? 'text-blue-500' : (theme === 'light' ? 'text-gray-900' : 'text-white')}`}>{song.title}</h3>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>{song.artist}</p>
                </div>
                {currentSong?.id === song.id && isPlaying && (
                  <BarChart2 className="w-4 h-4 text-blue-500 mr-4" />
                )}
                <span className={`text-xs mr-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>{song.duration}</span>
              </div>
            ))}
            {folderSongs.length === 0 && (
              <div className="p-8 text-center text-gray-500">No songs found in this folder.</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={`flex flex-col h-full ${theme === 'light' ? 'bg-gray-50 text-gray-900' : 'bg-[#12161e] text-white'}`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Menu className={`w-6 h-6 cursor-pointer ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`} onClick={() => setIsDrawerOpen(true)} />
            <h1 className="text-xl font-semibold">Folders</h1>
          </div>
          <div className="flex items-center gap-4">
            <Search className={`w-6 h-6 cursor-pointer ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`} onClick={() => setIsSearchOpen(true)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-32">
          {folders.map(folder => (
            <div 
              key={folder.id} 
              className={`flex items-center p-4 cursor-pointer border-b ${theme === 'light' ? 'hover:bg-gray-200 border-gray-200' : 'hover:bg-[#1e232d] border-gray-800/50'}`}
              onClick={() => setSelectedFolder(folder.path)}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${theme === 'light' ? 'bg-gray-200' : 'bg-[#1e232d]'}`}>
                <Folder className="w-6 h-6 text-blue-500" fill="currentColor" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className={`text-base font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{folder.name}</h3>
                <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>{folder.path}</p>
              </div>
              <span className={`text-sm mr-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>{folder.tracks} tracks</span>
              <ChevronRight className={`w-5 h-5 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const MoreScreen = () => (
    <div className={`flex flex-col h-full ${theme === 'light' ? 'bg-gray-50 text-gray-900' : 'bg-[#12161e] text-white'}`}>
      <div className={`flex items-center justify-between p-4 border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-800'}`}>
        <div className="flex items-center gap-4">
          <Menu className={`w-6 h-6 cursor-pointer ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`} onClick={() => setIsDrawerOpen(true)} />
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto pb-32 p-4 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-blue-500 mb-2 uppercase tracking-wider">General</h2>
          <div className={`rounded-xl overflow-hidden border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#1e232d] border-gray-800'}`}>
            <div className={`flex items-center p-4 border-b cursor-pointer ${theme === 'light' ? 'border-gray-100 hover:bg-gray-50' : 'border-gray-800/50 hover:bg-gray-800/50'}`} onClick={() => {
              if (isScanning) return;
              fileInputRef.current?.click();
            }}>
              <ScanSearch className={`w-5 h-5 mr-4 ${isScanning ? 'animate-spin' : ''} ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
              <div className="flex-1">
                <div className="font-medium">{isScanning ? 'Scanning...' : 'Scan Local Music'}</div>
                <div className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Find new tracks on your device</div>
              </div>
            </div>
            <div className={`flex items-center p-4 border-b cursor-pointer ${theme === 'light' ? 'border-gray-100 hover:bg-gray-50' : 'border-gray-800/50 hover:bg-gray-800/50'}`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Moon className="w-5 h-5 text-gray-400 mr-4" /> : <Sun className="w-5 h-5 text-gray-500 mr-4" />}
              <div className="flex-1">
                <div className="font-medium">Theme</div>
                <div className={`text-xs capitalize ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>{theme} Mode</div>
              </div>
            </div>
            <div className={`flex items-center p-4 cursor-pointer ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-800/50'}`} onClick={() => setSleepTimer(sleepTimer ? null : 30)}>
              <Clock className={`w-5 h-5 mr-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
              <div className="flex-1">
                <div className="font-medium">Sleep Timer</div>
                <div className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>{sleepTimer ? `Stops in ${sleepTimer} mins` : 'Off'}</div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${sleepTimer ? 'bg-blue-500' : (theme === 'light' ? 'bg-gray-300' : 'bg-gray-600')}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${sleepTimer ? 'left-[22px]' : 'left-0.5'}`} />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-blue-500 mb-2 uppercase tracking-wider">Audio & Playback</h2>
          <div className={`rounded-xl overflow-hidden border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#1e232d] border-gray-800'}`}>
            <div className={`flex items-center p-4 border-b cursor-pointer ${theme === 'light' ? 'border-gray-100 hover:bg-gray-50' : 'border-gray-800/50 hover:bg-gray-800/50'}`} onClick={() => setPlaybackSpeed(s => s >= 2 ? 0.5 : s + 0.25)}>
              <Play className={`w-5 h-5 mr-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
              <div className="flex-1">
                <div className="font-medium">Playback Speed</div>
                <div className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>{playbackSpeed}x</div>
              </div>
            </div>
            <div className={`flex items-center p-4 cursor-pointer ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-800/50'}`} onClick={() => setHeadsetControls(!headsetControls)}>
              <Headphones className={`w-5 h-5 mr-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
              <div className="flex-1">
                <div className="font-medium">Headset Controls</div>
                <div className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Play/Pause on headset connect/disconnect</div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${headsetControls ? 'bg-blue-500' : (theme === 'light' ? 'bg-gray-300' : 'bg-gray-600')}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${headsetControls ? 'left-[22px]' : 'left-0.5'}`} />
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-sm font-semibold text-blue-500 mb-2 uppercase tracking-wider">About</h2>
          <div className={`rounded-xl overflow-hidden border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#1e232d] border-gray-800'}`}>
            <div className={`flex items-center p-4 border-b cursor-pointer ${theme === 'light' ? 'border-gray-100 hover:bg-gray-50' : 'border-gray-800/50 hover:bg-gray-800/50'}`}>
              <Shield className={`w-5 h-5 mr-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className="flex-1 font-medium">Privacy Policy</span>
            </div>
            <div className={`flex items-center p-4 cursor-pointer ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-gray-800/50'}`}>
              <Info className={`w-5 h-5 mr-4 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
              <span className="flex-1 font-medium">Version 1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const NowPlayingScreen = () => {
    if (!currentSong) return null;
    return (
      <div className={`flex flex-col h-full relative overflow-hidden ${theme === 'light' ? 'bg-gray-50 text-gray-900' : 'bg-[#12161e] text-white'}`}>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center justify-between p-4 z-10">
          <ArrowLeft className={`w-6 h-6 cursor-pointer ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`} onClick={() => setCurrentScreen('library')} />
          <h1 className="text-lg font-semibold">Now Playing</h1>
          <div className="w-6 h-6" />
        </div>

        <div className="flex-1 flex items-center justify-center p-8 z-10">
          <div className={`w-72 h-72 rounded-full border-[16px] shadow-2xl flex items-center justify-center overflow-hidden relative ${theme === 'light' ? 'bg-gray-200 border-gray-100' : 'bg-[#1e232d] border-[#1a1f29]'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 mix-blend-overlay"></div>
            <img src={currentSong.cover} alt="Album Art" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className={`absolute w-16 h-16 rounded-full border-4 flex items-center justify-center ${theme === 'light' ? 'bg-white border-gray-100' : 'bg-[#12161e] border-[#1a1f29]'}`}>
              <span className="text-[8px] text-gray-500 text-center leading-tight">MODERN<br/>NPMCAT</span>
            </div>
          </div>
        </div>

        <div className="px-8 text-center z-10 mb-8">
          <h2 className="text-2xl font-bold mb-2">{currentSong.title}</h2>
          <p className="text-blue-500 text-base">{currentSong.artist.split(' • ')[0]}</p>
        </div>

        <div className="px-8 z-10 mb-8">
          <div className={`flex justify-between text-xs mb-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || 0)}</span>
          </div>
          <div className={`h-1.5 rounded-full relative cursor-pointer ${theme === 'light' ? 'bg-gray-300' : 'bg-gray-800'}`} onClick={handleSeek}>
            <div className="absolute left-0 top-0 h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="px-8 flex items-center justify-center gap-8 z-10 mb-12">
          <SkipBack className={`w-8 h-8 cursor-pointer ${theme === 'light' ? 'text-gray-800' : 'text-white'}`} onClick={handlePrev} />
          <button 
            className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)]"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-8 h-8 text-white" fill="currentColor" /> : <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />}
          </button>
          <SkipForward className={`w-8 h-8 cursor-pointer ${theme === 'light' ? 'text-gray-800' : 'text-white'}`} onClick={handleNext} />
        </div>
      </div>
    );
  };

  const MiniPlayer = () => {
    if (!showMiniPlayer || currentScreen === 'nowPlaying' || !currentSong) return null;
    return (
      <div className={`absolute bottom-[60px] left-0 right-0 border-t flex items-center p-2 px-4 cursor-pointer z-40 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#1e232d] border-gray-800'}`} onClick={() => setCurrentScreen('nowPlaying')}>
        <img src={currentSong.cover} alt="Cover" className="w-10 h-10 rounded object-cover" referrerPolicy="no-referrer" />
        <div className="ml-3 flex-1 overflow-hidden">
          <h4 className={`text-sm font-medium truncate ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{currentSong.title}</h4>
          <p className={`text-xs truncate ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>{currentSong.artist}</p>
        </div>
        <div className="flex items-center gap-4 ml-4">
          <button onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}>
            {isPlaying ? <Pause className={`w-6 h-6 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`} fill="currentColor" /> : <Play className={`w-6 h-6 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`} fill="currentColor" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); setShowMiniPlayer(false); setIsPlaying(false); }}>
            <X className={`w-6 h-6 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`} />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500" style={{ width: `${progress}%` }}></div>
      </div>
    );
  };

  const BottomNav = () => {
    if (currentScreen === 'nowPlaying') return null;
    return (
      <div className={`absolute bottom-0 left-0 right-0 h-[60px] border-t flex items-center justify-around z-50 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#12161e] border-gray-800'}`}>
        <button 
          className={`flex flex-col items-center gap-1 ${currentScreen === 'folders' ? 'text-blue-500' : (theme === 'light' ? 'text-gray-500' : 'text-gray-400')}`}
          onClick={() => { setCurrentScreen('folders'); setSelectedFolder(null); }}
        >
          <Folder className="w-5 h-5" />
          <span className="text-[10px]">Folders</span>
        </button>
        <button 
          className={`flex flex-col items-center gap-1 ${currentScreen === 'library' ? 'text-blue-500' : (theme === 'light' ? 'text-gray-500' : 'text-gray-400')}`}
          onClick={() => { setCurrentScreen('library'); setSelectedFolder(null); }}
        >
          <Music className="w-5 h-5" />
          <span className="text-[10px]">Music</span>
        </button>
        <button 
          className={`flex flex-col items-center gap-1 ${currentScreen === 'more' ? 'text-blue-500' : (theme === 'light' ? 'text-gray-500' : 'text-gray-400')}`}
          onClick={() => { setCurrentScreen('more'); setSelectedFolder(null); }}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px]">More</span>
        </button>
      </div>
    );
  };

  return (
    <div className={`w-full h-screen max-w-md mx-auto relative overflow-hidden shadow-2xl sm:rounded-3xl sm:h-[850px] sm:my-8 border ${theme === 'light' ? 'bg-gray-50 text-gray-900 border-gray-200' : 'bg-black text-white border-gray-800'}`}>
      {currentScreen === 'library' && <LibraryScreen />}
      {currentScreen === 'folders' && <FoldersScreen />}
      {currentScreen === 'more' && <MoreScreen />}
      {currentScreen === 'nowPlaying' && <NowPlayingScreen />}
      
      <SearchOverlay />
      <Drawer />
      <MiniPlayer />
      <BottomNav />

      <input 
        type="file" 
        accept="audio/*" 
        multiple 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileSelect} 
      />

      <audio 
        ref={audioRef}
        src={currentSong?.url}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
    </div>
  );
}
