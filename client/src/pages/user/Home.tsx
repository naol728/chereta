import Banner from '@/components/Banner';
import BidStep from '@/components/BidStep';
import LiveBid from '@/components/LiveBid';
import PreviousBid from '@/components/Priviousbid';
import React from 'react'

export default function Home() {

    return (
        <>
            <Banner />
            <LiveBid />
            <BidStep />
            <PreviousBid />
        </>

    )
}
