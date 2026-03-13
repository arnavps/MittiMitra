import { supabase } from '@/utils/supabase/client';
import { auth } from '@/services/firebase';

export const fetchProfile = async (phone?: string) => {
    try {
        const phoneToUse = phone || auth.currentUser?.phoneNumber || localStorage.getItem('demo_phone') || "9999999999";
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone', phoneToUse)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
    }
};

export const updateProfile = async (profile: any) => {
    try {
        const { error } = await supabase
            .from('profiles')
            .upsert(profile);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error("Error updating profile:", error);
        return false;
    }
};
