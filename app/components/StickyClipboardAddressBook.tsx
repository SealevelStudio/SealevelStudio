'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Clipboard, 
  ClipboardCheck, 
  BookOpen, 
  Plus, 
  X, 
  Search, 
  Copy, 
  Star,
  Trash2,
  Edit2,
  Check,
  ExternalLink,
  User,
  Building2,
  Wallet
} from 'lucide-react';

interface AddressBookEntry {
  id: string;
  name: string;
  address: string;
  label?: string;
  tags?: string[];
  createdAt: number;
  isFavorite?: boolean;
}

interface StickyClipboardAddressBookProps {
  onAddressSelect?: (address: string) => void;
  onCopy?: (address: string) => void;
  className?: string;
  compact?: boolean; // For narrow sidebars
}

export function StickyClipboardAddressBook({ 
  onAddressSelect, 
  onCopy,
  className = '',
  compact = false 
}: StickyClipboardAddressBookProps) {
  const [clipboardItems, setClipboardItems] = useState<string[]>([]);
  const [addressBook, setAddressBook] = useState<AddressBookEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'clipboard' | 'addressbook'>('clipboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AddressBookEntry | null>(null);
  const [newEntry, setNewEntry] = useState({ name: '', address: '', label: '', tags: '' });
  const [justCopied, setJustCopied] = useState<string | null>(null);
  
  // Load clipboard and address book from localStorage
  useEffect(() => {
    const loadClipboard = () => {
      try {
        const saved = localStorage.getItem('txBuilderClipboard');
        if (saved) {
          setClipboardItems(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load clipboard:', e);
      }
    };
    
    const loadAddressBook = () => {
      try {
        const saved = localStorage.getItem('txBuilderAddressBook');
        if (saved) {
          setAddressBook(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Failed to load address book:', e);
      }
    };
    
    loadClipboard();
    loadAddressBook();
  }, []);

  // Save clipboard to localStorage
  useEffect(() => {
    if (clipboardItems.length > 0) {
      localStorage.setItem('txBuilderClipboard', JSON.stringify(clipboardItems.slice(0, 50)));
    }
  }, [clipboardItems]);

  // Save address book to localStorage
  useEffect(() => {
    if (addressBook.length > 0) {
      localStorage.setItem('txBuilderAddressBook', JSON.stringify(addressBook));
    }
  }, [addressBook]);

  // Listen for clipboard changes (global clipboard listener)
  useEffect(() => {
    const handleClipboardChange = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text');
      if (text && isValidSolanaAddress(text)) {
        addToClipboard(text);
      }
    };

    // Listen for paste events
    window.addEventListener('paste', handleClipboardChange);
    
    // Poll clipboard for changes (fallback)
    const pollInterval = setInterval(() => {
      navigator.clipboard.readText().then(text => {
        if (text && isValidSolanaAddress(text) && !clipboardItems.includes(text)) {
          addToClipboard(text);
        }
      }).catch(() => {
        // Clipboard API not available or permission denied
      });
    }, 2000);

    return () => {
      window.removeEventListener('paste', handleClipboardChange);
      clearInterval(pollInterval);
    };
  }, [clipboardItems]);

  const isValidSolanaAddress = (address: string): boolean => {
    try {
      // Solana addresses are base58 and 32 bytes (44 chars)
      if (!address || address.length < 32 || address.length > 44) return false;
      new (require('@solana/web3.js').PublicKey)(address);
      return true;
    } catch {
      return false;
    }
  };

  const addToClipboard = (address: string) => {
    if (!address || !isValidSolanaAddress(address)) return;
    setClipboardItems(prev => {
      const filtered = prev.filter(addr => addr !== address);
      return [address, ...filtered].slice(0, 50); // Keep last 50
    });
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setJustCopied(address);
      setTimeout(() => setJustCopied(null), 2000);
      
      // Add to clipboard if not already there
      if (!clipboardItems.includes(address)) {
        addToClipboard(address);
      }
      
      onCopy?.(address);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const selectAddress = (address: string) => {
    onAddressSelect?.(address);
    copyAddress(address);
  };

  const addAddressBookEntry = () => {
    if (!newEntry.name || !newEntry.address || !isValidSolanaAddress(newEntry.address)) {
      return;
    }

    const entry: AddressBookEntry = {
      id: `entry_${Date.now()}`,
      name: newEntry.name,
      address: newEntry.address,
      label: newEntry.label || undefined,
      tags: newEntry.tags ? newEntry.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      createdAt: Date.now(),
      isFavorite: false,
    };

    setAddressBook(prev => [...prev, entry]);
    setNewEntry({ name: '', address: '', label: '', tags: '' });
    setShowAddForm(false);
  };

  const updateAddressBookEntry = (id: string, updates: Partial<AddressBookEntry>) => {
    setAddressBook(prev => prev.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    ));
    setEditingEntry(null);
  };

  const deleteAddressBookEntry = (id: string) => {
    setAddressBook(prev => prev.filter(entry => entry.id !== id));
  };

  const toggleFavorite = (id: string) => {
    setAddressBook(prev => prev.map(entry => 
      entry.id === id ? { ...entry, isFavorite: !entry.isFavorite } : entry
    ));
  };

  const filteredAddressBook = addressBook.filter(entry => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.name.toLowerCase().includes(query) ||
      entry.address.toLowerCase().includes(query) ||
      entry.label?.toLowerCase().includes(query) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  });

  // Sort: favorites first, then by name
  const sortedAddressBook = [...filteredAddressBook].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return a.name.localeCompare(b.name);
  });

  if (compact) {
    // Compact mode for narrow sidebars (desktop only)
    return (
      <aside className={`hidden md:flex flex-col border-l border-slate-800 bg-slate-900/30 ${className}`}>
        <div className="flex items-center justify-center p-2 border-b border-slate-800">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('clipboard')}
              className={`p-2 rounded transition-colors ${
                activeTab === 'clipboard' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Clipboard"
            >
              <Clipboard size={16} />
            </button>
            <button
              onClick={() => setActiveTab('addressbook')}
              className={`p-2 rounded transition-colors ${
                activeTab === 'addressbook' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Address Book"
            >
              <BookOpen size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {activeTab === 'clipboard' ? (
            <div className="space-y-1">
              {clipboardItems.length === 0 ? (
                <div className="text-center py-4">
                  <Clipboard size={20} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No addresses copied</p>
                </div>
              ) : (
                clipboardItems.slice(0, 10).map((address, index) => (
                  <button
                    key={index}
                    onClick={() => selectAddress(address)}
                    className="w-full text-left p-2 rounded hover:bg-slate-800 transition-colors group"
                    title={address}
                  >
                    <div className="text-xs font-mono text-slate-300 truncate">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {sortedAddressBook.length === 0 ? (
                <div className="text-center py-4">
                  <BookOpen size={20} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No saved addresses</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-2 text-xs text-purple-400 hover:text-purple-300"
                  >
                    Add First
                  </button>
                </div>
              ) : (
                <>
                  {sortedAddressBook.slice(0, 10).map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => selectAddress(entry.address)}
                      className="w-full text-left p-2 rounded hover:bg-slate-800 transition-colors group"
                      title={`${entry.name} - ${entry.address}`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {entry.isFavorite && <Star size={12} className="text-yellow-400 fill-yellow-400" />}
                        <span className="text-xs font-semibold text-slate-200 truncate">{entry.name}</span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 truncate">
                        {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full p-2 rounded border border-dashed border-slate-700 text-slate-500 hover:text-purple-400 hover:border-purple-600 transition-colors text-xs"
                  >
                    <Plus size={12} className="mx-auto" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </aside>
    );
  }

  // Full mode (wider sidebar)
  return (
    <aside className={`hidden md:flex flex-col w-72 border-l border-slate-800 bg-slate-900/30 ${className}`}>
      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('clipboard')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'clipboard'
              ? 'bg-slate-800 text-purple-400 border-b-2 border-purple-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Clipboard size={16} />
          Clipboard
          {clipboardItems.length > 0 && (
            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
              {clipboardItems.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('addressbook')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'addressbook'
              ? 'bg-slate-800 text-purple-400 border-b-2 border-purple-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <BookOpen size={16} />
          Address Book
          {addressBook.length > 0 && (
            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {addressBook.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'clipboard' ? (
          <div className="p-4 space-y-2">
            {clipboardItems.length === 0 ? (
              <div className="text-center py-8">
                <Clipboard size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No addresses in clipboard</p>
                <p className="text-xs text-slate-600 mt-1">Copied addresses will appear here</p>
              </div>
            ) : (
              clipboardItems.map((address, index) => (
                <div
                  key={index}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 hover:border-purple-500/50 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-xs font-mono text-slate-300 flex-1 truncate">
                      {address}
                    </code>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyAddress(address)}
                        className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-slate-700 rounded transition-colors"
                        title="Copy"
                      >
                        {justCopied === address ? (
                          <ClipboardCheck size={14} className="text-green-400" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => selectAddress(address)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition-colors"
                        title="Use address"
                      >
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setNewEntry({ name: '', address, label: '', tags: '' });
                        setActiveTab('addressbook');
                        setShowAddForm(true);
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      <Plus size={12} />
                      Save to Address Book
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search addresses..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Add Form */}
            {showAddForm && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-200">Add Address</h4>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewEntry({ name: '', address: '', label: '', tags: '' });
                    }}
                    className="p-1 text-slate-400 hover:text-slate-200"
                  >
                    <X size={16} />
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Name"
                  value={newEntry.name}
                  onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={newEntry.address}
                  onChange={(e) => setNewEntry({ ...newEntry, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 font-mono placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <input
                  type="text"
                  placeholder="Label (optional)"
                  value={newEntry.label}
                  onChange={(e) => setNewEntry({ ...newEntry, label: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={newEntry.tags}
                  onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={addAddressBookEntry}
                  disabled={!newEntry.name || !newEntry.address || !isValidSolanaAddress(newEntry.address)}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Add Address
                </button>
              </div>
            )}

            {/* Address List */}
            {sortedAddressBook.length === 0 && !showAddForm ? (
              <div className="text-center py-8">
                <BookOpen size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No saved addresses</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Add First Address
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedAddressBook.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 hover:border-purple-500/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {entry.isFavorite && (
                            <Star size={14} className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                          )}
                          <h5 className="text-sm font-semibold text-slate-200 truncate">{entry.name}</h5>
                          {entry.label && (
                            <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">
                              {entry.label}
                            </span>
                          )}
                        </div>
                        <code className="text-xs font-mono text-slate-400 break-all">
                          {entry.address}
                        </code>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-purple-900/30 text-purple-300 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => toggleFavorite(entry.id)}
                          className="p-1.5 text-slate-400 hover:text-yellow-400 rounded transition-colors"
                          title={entry.isFavorite ? 'Remove favorite' : 'Add to favorites'}
                        >
                          <Star size={14} className={entry.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''} />
                        </button>
                        <button
                          onClick={() => copyAddress(entry.address)}
                          className="p-1.5 text-slate-400 hover:text-purple-400 rounded transition-colors"
                          title="Copy"
                        >
                          {justCopied === entry.address ? (
                            <ClipboardCheck size={14} className="text-green-400" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => selectAddress(entry.address)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 rounded transition-colors"
                          title="Use address"
                        >
                          <ExternalLink size={14} />
                        </button>
                        <button
                          onClick={() => deleteAddressBookEntry(entry.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

