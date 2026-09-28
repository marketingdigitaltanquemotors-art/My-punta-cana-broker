import Image from 'next/image';

export function Brand() {
  return (
    <span className="brand">
      <Image
        className="brand-logo"
        src="/my-punta-cana-broker-logo.png"
        alt="My Punta Cana Broker"
        width={1536}
        height={1024}
        priority
      />
    </span>
  );
}
