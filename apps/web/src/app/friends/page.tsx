'use client';

import { useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Protected } from '@/components/protected';
import { TopNav } from '@/components/top-nav';
import {
  acceptFriendRequest,
  fetchFriends,
  fetchRequests,
  fetchSuggestions,
  removeFriend,
  searchUsers,
  sendFriendRequest,
} from '@/features/friends/api';
import {
  BtnGhost,
  BtnPrimary,
  UserRow,
} from '@/features/friends/user-row';

type Tab = 'requests' | 'suggestions' | 'friends';

const TAB_LABEL: Record<Tab, string> = {
  requests: 'Lời mời',
  suggestions: 'Gợi ý',
  friends: 'Bạn bè',
};

function FriendsContent() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('requests');
  const [search, setSearch] = useState('');

  const requests = useQuery({
    queryKey: ['friend-requests'],
    queryFn: () => fetchRequests('incoming'),
  });
  const suggestions = useQuery({
    queryKey: ['friend-suggestions'],
    queryFn: fetchSuggestions,
  });
  const friends = useQuery({
    queryKey: ['friends'],
    queryFn: fetchFriends,
  });
  const searchResults = useQuery({
    queryKey: ['user-search', search],
    queryFn: () => searchUsers(search),
    enabled: search.trim().length > 0,
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['friend-requests'] });
    qc.invalidateQueries({ queryKey: ['friend-suggestions'] });
    qc.invalidateQueries({ queryKey: ['friends'] });
    qc.invalidateQueries({ queryKey: ['user-search'] });
    qc.invalidateQueries({ queryKey: ['feed'] });
  };

  const addMut = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: invalidateAll,
  });
  const acceptMut = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: invalidateAll,
  });
  const removeMut = useMutation({
    mutationFn: removeFriend,
    onSuccess: invalidateAll,
  });

  const busy = addMut.isPending || acceptMut.isPending || removeMut.isPending;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <TopNav />
      <main className="mx-auto max-w-xl space-y-4 px-4 py-6">
        <h1 className="text-2xl font-bold">Bạn bè</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Tìm người dùng theo tên hoặc username…"
          className="w-full rounded-full bg-white px-4 py-2.5 shadow-sm outline-none focus:ring-2 focus:ring-brand dark:bg-gray-900"
        />

        {search.trim() ? (
          <section className="space-y-2">
            <p className="text-sm text-gray-400">
              Kết quả cho “{search.trim()}”
            </p>
            {searchResults.isLoading && (
              <p className="text-sm text-gray-400">Đang tìm…</p>
            )}
            {searchResults.data?.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                actions={
                  <BtnPrimary onClick={() => addMut.mutate(u.id)} disabled={busy}>
                    Kết bạn
                  </BtnPrimary>
                }
              />
            ))}
            {searchResults.data?.length === 0 && !searchResults.isLoading && (
              <p className="text-sm text-gray-400">Không tìm thấy ai.</p>
            )}
          </section>
        ) : (
          <>
            <div className="flex gap-2">
              {(Object.keys(TAB_LABEL) as Tab[]).map((t) => {
                const count =
                  t === 'requests'
                    ? requests.data?.length
                    : t === 'friends'
                      ? friends.data?.length
                      : undefined;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                      tab === t
                        ? 'bg-brand text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800'
                    }`}
                  >
                    {TAB_LABEL[t]}
                    {count ? ` (${count})` : ''}
                  </button>
                );
              })}
            </div>

            {tab === 'requests' && (
              <section className="space-y-2">
                {requests.data?.map((r) => (
                  <UserRow
                    key={r.friendshipId}
                    user={r.user}
                    actions={
                      <>
                        <BtnPrimary
                          onClick={() => acceptMut.mutate(r.user.id)}
                          disabled={busy}
                        >
                          Chấp nhận
                        </BtnPrimary>
                        <BtnGhost
                          onClick={() => removeMut.mutate(r.user.id)}
                          disabled={busy}
                        >
                          Từ chối
                        </BtnGhost>
                      </>
                    }
                  />
                ))}
                {requests.data?.length === 0 && (
                  <p className="py-6 text-center text-sm text-gray-400">
                    Không có lời mời nào.
                  </p>
                )}
              </section>
            )}

            {tab === 'suggestions' && (
              <section className="space-y-2">
                {suggestions.data?.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    actions={
                      <BtnPrimary
                        onClick={() => addMut.mutate(u.id)}
                        disabled={busy}
                      >
                        Kết bạn
                      </BtnPrimary>
                    }
                  />
                ))}
                {suggestions.data?.length === 0 && (
                  <p className="py-6 text-center text-sm text-gray-400">
                    Chưa có gợi ý nào.
                  </p>
                )}
              </section>
            )}

            {tab === 'friends' && (
              <section className="space-y-2">
                {friends.data?.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    actions={
                      <BtnGhost
                        onClick={() => removeMut.mutate(u.id)}
                        disabled={busy}
                      >
                        Hủy kết bạn
                      </BtnGhost>
                    }
                  />
                ))}
                {friends.data?.length === 0 && (
                  <p className="py-6 text-center text-sm text-gray-400">
                    Chưa có bạn bè nào. Vào tab “Gợi ý” để kết bạn nhé!
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function FriendsPage() {
  return (
    <Protected>
      <FriendsContent />
    </Protected>
  );
}
